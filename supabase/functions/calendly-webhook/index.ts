import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, calendly-webhook-signature",
};

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function isValidSignature(rawBody: string, signatureHeader: string | null, signingKey: string) {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(signatureHeader.split(",").map((p) => p.split("=")));
  const { t: timestamp, v1: signature } = parts;
  if (!timestamp || !signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expected, signature);
}

// O Calendly só devolve telefone se: (a) o convidado ativou lembrete por SMS,
// ou (b) existe uma pergunta personalizada de telefone no tipo de evento.
function extractPhone(payload: Record<string, unknown>): string | null {
  if (typeof payload.text_reminder_number === "string") return payload.text_reminder_number;
  const questions = (payload.questions_and_answers as Array<{ question: string; answer: string }>) ?? [];
  const match = questions.find((q) => /telefone|telem[oó]vel|phone|whatsapp/i.test(q.question));
  return match?.answer ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rawBody = await req.text();
  const signingKey = Deno.env.get("CALENDLY_WEBHOOK_SIGNING_KEY");

  if (!signingKey) {
    return new Response(JSON.stringify({ error: "CALENDLY_WEBHOOK_SIGNING_KEY não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const signature = req.headers.get("Calendly-Webhook-Signature");
  const valid = await isValidSignature(rawBody, signature, signingKey);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Assinatura inválida" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = JSON.parse(rawBody);

  // Responde já; só o "invitee.created" nos interessa para criar leads.
  if (body.event !== "invitee.created") {
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = body.payload as Record<string, unknown>;
  const name = (payload.name as string) || "Lead do Calendly";
  const email = (payload.email as string) || null;
  const phone = extractPhone(payload);
  const eventName =
    ((payload.scheduled_event as Record<string, unknown> | undefined)?.name as string | undefined) ??
    "reunião";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Evita duplicados em retries do Calendly ou se a mesma pessoa marcar mais que uma vez.
  if (email) {
    const { data: existing } = await adminClient
      .from("crm_contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const { error } = await adminClient.from("crm_contacts").insert({
    name,
    email,
    phone,
    source: "Calendly",
    stage: "lead",
    notes: `Marcou "${eventName}" através do Calendly.`,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
