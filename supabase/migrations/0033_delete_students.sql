-- Permite ao admin apagar perfis de alunos (nunca contas de admin/mentor,
-- incluindo a própria). Usada pela função delete-student, que também apaga
-- a conta de autenticação correspondente.
create policy "Admin apaga alunos" on public.profiles
  for delete
  using (is_admin() and role = 'student');
