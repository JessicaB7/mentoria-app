-- Capas dos módulos: coluna + bucket público (as capas não são conteúdo sensível)

alter table public.modules add column cover_path text;

insert into storage.buckets (id, name, public)
values ('module-covers', 'module-covers', true)
on conflict (id) do nothing;

create policy "Qualquer um lê capas de módulos"
  on storage.objects for select
  using (bucket_id = 'module-covers');

create policy "Admin escreve capas de módulos"
  on storage.objects for insert
  with check (bucket_id = 'module-covers' and public.is_admin());

create policy "Admin atualiza capas de módulos"
  on storage.objects for update
  using (bucket_id = 'module-covers' and public.is_admin());

create policy "Admin remove capas de módulos"
  on storage.objects for delete
  using (bucket_id = 'module-covers' and public.is_admin());
