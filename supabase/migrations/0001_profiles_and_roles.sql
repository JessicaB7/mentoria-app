-- Perfis de utilizador (admin / aluno) e sincronização com auth.users

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'student' check (role in ('admin', 'student')),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Função auxiliar (security definer) para evitar recursão nas policies
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Utilizador vê o próprio perfil"
  on public.profiles for select
  using (id = auth.uid());

create policy "Admin vê todos os perfis"
  on public.profiles for select
  using (public.is_admin());

create policy "Utilizador atualiza o próprio perfil"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admin atualiza todos os perfis"
  on public.profiles for update
  using (public.is_admin());

-- Cria automaticamente um perfil (role = student) quando um utilizador se regista
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'student'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- NOTA: depois de criares a tua primeira conta na app, promove-a a admin com:
-- update public.profiles set role = 'admin' where email = 'o-teu-email@exemplo.pt';
