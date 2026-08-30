# Mentoria — plataforma de aulas + CRM

App para a mentoria: os alunos veem aulas e materiais, e tu (admin) geres aulas, alunos e o CRM de leads/clientes. Stack: Vite + React + TypeScript + Tailwind v4 + Supabase (auth, base de dados, storage).

## 1. Criar o projeto no Supabase

1. Cria uma conta/projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, copia o `Project URL` e a chave `anon public`.
3. Cria o ficheiro `.env` na raiz (usa `.env.example` como modelo):

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```

## 2. Correr as migrations

Não tens o Supabase CLI instalado, por isso o mais simples é copiar cada ficheiro de `supabase/migrations/` (por ordem, 0001 → 0004) para o **SQL Editor** do teu projeto Supabase e correr um a um:

- `0001_profiles_and_roles.sql` — perfis, papéis (admin/aluno) e criação automática de perfil ao registar
- `0002_courses.sql` — módulos, aulas, materiais e progresso dos alunos
- `0003_crm.sql` — contactos, pipeline e tarefas do CRM
- `0004_storage.sql` — buckets privados para vídeos e materiais

Se preferires, instala o [Supabase CLI](https://supabase.com/docs/guides/cli) e usa `supabase link` + `supabase db push`.

## 3. Criar a tua conta de admin

Ainda não há forma de criar a primeira conta pela app (só o admin pode criar alunos). Faz assim:

1. No dashboard Supabase, vai a **Authentication → Users → Add user** e cria a tua conta (email + palavra-passe).
2. Isto cria automaticamente uma linha em `profiles` com `role = 'student'`.
3. No **SQL Editor**, promove-te a admin:

   ```sql
   update public.profiles set role = 'admin' where email = 'o-teu-email@exemplo.pt';
   ```

4. Entra na app com essas credenciais — vais cair na área de admin.

## 4. Publicar a função "criar aluno"

O botão "Novo aluno" (em Admin → Alunos) cria contas para os alunos automaticamente, mas isso precisa de uma Edge Function com acesso privilegiado. Para a publicar:

```bash
npx supabase login
npx supabase link --project-ref <o-teu-project-ref>
npx supabase functions deploy create-student
```

Não precisas de configurar segredos — `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já ficam disponíveis automaticamente nas Edge Functions.

## 5. Ligar o Calendly ao CRM

Sempre que alguém marca uma chamada no teu Calendly, isto cria automaticamente um lead em Admin → CRM (estágio "Lead", origem "Calendly").

1. Publica a função (só precisas de fazer isto uma vez):

   ```bash
   npx supabase functions deploy calendly-webhook
   ```

2. Regista o webhook no Calendly, usando o teu `CALENDLY_PERSONAL_ACCESS_TOKEN` (o mesmo que já usas no `calendly-whatsapp-bot`):

   ```bash
   CALENDLY_PERSONAL_ACCESS_TOKEN=xxxxx node scripts/register-calendly-webhook.mjs
   ```

3. O comando acima devolve uma `signing_key` — guarda-a como segredo da função:

   ```bash
   npx supabase secrets set CALENDLY_WEBHOOK_SIGNING_KEY=<valor-devolvido> --project-ref <o-teu-project-ref>
   ```

A partir daí, qualquer marcação no Calendly cria o lead automaticamente (se a pessoa já existir no CRM pelo email, não duplica).

## 6. Correr localmente

```bash
npm install
npm run dev
```

## Notas

- **Vídeos das aulas**: ficam guardados no Supabase Storage (bucket privado `lesson-videos`), servidos por URLs assinadas válidas 1h. Fica atenta aos limites de armazenamento do teu plano Supabase à medida que fores adicionando vídeo.
- **Capas dos módulos**: no bucket público `module-covers`.
- **CRM**: só é visível para admins (contactos/leads, pipeline com 5 estágios, tarefas de follow-up por contacto).
- **Materiais**: PDFs e outros ficheiros de apoio por aula, também no Storage (bucket `materials`).
- **Vista Mentor/Aluno**: o admin tem um interruptor no menu lateral para pré-visualizar a área de aluno sem precisar de outra conta.
- Build de produção: `npm run build`. Podes publicar o `dist/` em qualquer host estático (Vercel, Netlify, etc.) — lembra-te de configurar lá as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
