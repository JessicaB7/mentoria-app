-- Ferramentas e templates partilhados com todos os alunos.
-- Cada ferramenta é um ficheiro (guardado no bucket "materials") ou um link externo.

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  url text,
  file_path text,
  file_type text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tools_url_or_file check (url is not null or file_path is not null)
);

alter table public.tools enable row level security;

create policy "Alunos veem ferramentas publicadas"
  on public.tools for select
  using (published = true and auth.role() = 'authenticated');

create policy "Admin gere ferramentas"
  on public.tools for all
  using (public.is_admin())
  with check (public.is_admin());
