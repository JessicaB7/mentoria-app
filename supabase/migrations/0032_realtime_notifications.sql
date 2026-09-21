-- Ativa o Realtime em lesson_progress e profiles, para o admin receber
-- popups quando um aluno conclui uma aula ou preenche o Check-in
-- Mentoria. (Este projeto Supabase é partilhado com outras apps —
-- mexe-se só nestas duas tabelas, sem tocar na tabela "notifications"
-- já existente doutro sistema.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lesson_progress'
  ) then
    alter publication supabase_realtime add table public.lesson_progress;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- Precisamos do registo anterior completo (não só a chave primária)
-- para detetar quando o check-in passa de vazio a preenchido.
alter table public.profiles replica identity full;
