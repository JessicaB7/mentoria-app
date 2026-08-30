-- Buckets privados para vídeos das aulas e materiais de apoio

insert into storage.buckets (id, name, public)
values
  ('lesson-videos', 'lesson-videos', false),
  ('materials', 'materials', false)
on conflict (id) do nothing;

-- Qualquer utilizador autenticado com perfil pode ler (o acesso à app já exige login)
create policy "Autenticados leem vídeos e materiais"
  on storage.objects for select
  using (
    bucket_id in ('lesson-videos', 'materials')
    and auth.role() = 'authenticated'
  );

-- Só o admin faz upload/edição/remoção
create policy "Admin escreve vídeos e materiais"
  on storage.objects for insert
  with check (
    bucket_id in ('lesson-videos', 'materials')
    and public.is_admin()
  );

create policy "Admin atualiza vídeos e materiais"
  on storage.objects for update
  using (
    bucket_id in ('lesson-videos', 'materials')
    and public.is_admin()
  );

create policy "Admin remove vídeos e materiais"
  on storage.objects for delete
  using (
    bucket_id in ('lesson-videos', 'materials')
    and public.is_admin()
  );
