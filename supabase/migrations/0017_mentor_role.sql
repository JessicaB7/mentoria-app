-- Adiciona o papel 'mentor', com exatamente as mesmas permissões que 'admin'.

-- 1. Permitir 'mentor' como valor válido de role
alter table public.profiles
  drop constraint profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'mentor', 'student'));

-- 2. is_admin() passa a reconhecer também 'mentor'.
--    Como todas as policies (cursos, CRM, storage, pagamentos, etc.) usam esta função,
--    o mentor herda automaticamente o mesmo acesso do admin em toda a app.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'mentor')
    );
$$;

-- NOTA: para promoveres uma conta existente a mentor:
-- update public.profiles set role = 'mentor' where email = 'email-do-mentor@exemplo.pt';
