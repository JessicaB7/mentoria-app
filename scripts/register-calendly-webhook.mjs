// Regista uma subscrição de webhook no Calendly para o evento "invitee.created",
// apontado para a função calendly-webhook da mentoria (já publicada no Supabase).
//
// Corre isto UMA VEZ:
//   CALENDLY_PERSONAL_ACCESS_TOKEN=xxxxx node scripts/register-calendly-webhook.mjs
//
// O signing_key devolvido tem de ser guardado como secret da função no Supabase:
//   npx supabase secrets set CALENDLY_WEBHOOK_SIGNING_KEY=<valor-devolvido> --project-ref jubrvupqtwjufqhahtyt

const FUNCTION_URL = "https://jubrvupqtwjufqhahtyt.supabase.co/functions/v1/calendly-webhook";

async function main() {
  const token = process.env.CALENDLY_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Define CALENDLY_PERSONAL_ACCESS_TOKEN antes de correr este script.");
  }

  const me = await calendlyGet("https://api.calendly.com/users/me", token);
  const organization = me.resource.current_organization;
  const user = me.resource.uri;

  const response = await fetch("https://api.calendly.com/webhook_subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: FUNCTION_URL,
      events: ["invitee.created"],
      organization,
      user,
      scope: "user",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao criar webhook (${response.status}): ${body}`);
  }

  const data = await response.json();
  console.log("Webhook criado com sucesso, a apontar para:", FUNCTION_URL);
  console.log("\nAgora corre isto para guardar a chave de assinatura:");
  console.log(
    `npx supabase secrets set CALENDLY_WEBHOOK_SIGNING_KEY=${data.resource.signing_key} --project-ref jubrvupqtwjufqhahtyt`,
  );
}

async function calendlyGet(url, token) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Falha ao chamar ${url} (${response.status})`);
  }
  return response.json();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
