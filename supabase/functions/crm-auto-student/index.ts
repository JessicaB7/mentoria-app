import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const secret = req.headers.get("x-webhook-secret");
    if (!secret || secret !== Deno.env.get("CRM_WEBHOOK_SECRET")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { contact_id } = await req.json();
    const { data: contact, error: fetchErr } = await adminClient
      .from("crm_contacts")
      .select("*")
      .eq("id", contact_id)
      .maybeSingle();
    if (fetchErr || !contact) {
      return new Response(JSON.stringify({ error: "Contact not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (contact.stage !== "won" || contact.student_id) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!contact.email) {
      return new Response(JSON.stringify({ error: "Contact has no email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reaproveita a conta se já existir um perfil com este email (evita erro de duplicado)
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", contact.email)
      .maybeSingle();

    let userId: string;
    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // Sem admin presente para partilhar uma password gerada, convidamos o aluno por email
      // para ele próprio definir a password.
      const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
        contact.email,
        { data: { full_name: contact.name, phone: contact.phone ?? null } },
      );
      if (inviteErr) throw inviteErr;
      userId = invited.user.id;
    }

    await adminClient
      .from("profiles")
      .update({
        phone: contact.phone,
        start_date: contact.meeting_date,
        mentoria_value: contact.value,
        payment_method: contact.payment_method,
        installments_count: contact.installments_count,
      })
      .eq("id", userId);
    await adminClient.from("crm_contacts").update({ student_id: userId }).eq("id", contact.id);

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
