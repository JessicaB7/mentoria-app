-- Garante que um contacto que fica "Ganho" é sempre convertido em aluno,
-- mesmo quando o estágio é alterado fora da app (SQL direto, importação, etc.)
-- e não só através da UI.

create extension if not exists pg_net;

create or replace function public.crm_contact_won_sync()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.stage = 'won' and new.student_id is null then
    perform net.http_post(
      url := 'https://jubrvupqtwjufqhahtyt.supabase.co/functions/v1/crm-auto-student',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', 'db220b05d7e5b23576b2da8a8019069cf124ab678d6a106047d2ffa161d5b061'
      ),
      body := jsonb_build_object('contact_id', new.id)
    );
  end if;
  return new;
end;
$$;

create trigger crm_contacts_won_sync
  after insert or update on public.crm_contacts
  for each row execute function public.crm_contact_won_sync();
