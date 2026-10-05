-- Conteúdos de produção da mentora (slides, ferramentas, scripts das aulas).
-- Só a equipa (admin/mentor) vê e gere — nunca visível para os alunos.
-- Cada conteúdo é um ficheiro (bucket privado "mentor-contents") ou um link externo.

create table public.mentor_contents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null check (kind in ('slides', 'ferramentas', 'scripts')),
  url text,
  file_path text,
  file_type text,
  created_at timestamptz not null default now(),
  constraint mentor_contents_url_or_file check (url is not null or file_path is not null)
);

alter table public.mentor_contents enable row level security;

create policy "Equipa gere conteúdos"
  on public.mentor_contents for all
  using (public.is_admin())
  with check (public.is_admin());

-- Bucket próprio: o bucket "materials" é legível por qualquer aluno autenticado.
insert into storage.buckets (id, name, public)
values ('mentor-contents', 'mentor-contents', false)
on conflict (id) do nothing;

create policy "Equipa lê conteúdos"
  on storage.objects for select
  using (bucket_id = 'mentor-contents' and public.is_admin());

create policy "Equipa escreve conteúdos"
  on storage.objects for insert
  with check (bucket_id = 'mentor-contents' and public.is_admin());

create policy "Equipa atualiza conteúdos"
  on storage.objects for update
  using (bucket_id = 'mentor-contents' and public.is_admin());

create policy "Equipa remove conteúdos"
  on storage.objects for delete
  using (bucket_id = 'mentor-contents' and public.is_admin());
