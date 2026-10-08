-- Cada gravação de sessão pode ser escondida dos alunos sem esconder a aula inteira.
alter table public.session_recordings add column if not exists visible boolean not null default true;

-- Política restritiva: soma-se à política de leitura que já existe ("Alunos veem gravacoes de aulas publicadas")
-- sem a substituir. O admin continua a ver todas.
create policy "Alunos so veem gravacoes visiveis"
  on public.session_recordings as restrictive for select
  using (visible = true or public.is_admin());
