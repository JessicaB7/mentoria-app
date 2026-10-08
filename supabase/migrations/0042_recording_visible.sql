-- Cada gravação de sessão pode ser escondida dos alunos sem esconder a aula inteira.
alter table public.session_recordings add column if not exists visible boolean not null default true;

drop policy "Alunos veem gravações de aulas publicadas" on public.session_recordings;
create policy "Alunos veem gravações de aulas publicadas"
  on public.session_recordings for select
  using (
    session_recordings.visible = true
    and exists (
      select 1 from public.lessons
      where lessons.id = session_recordings.lesson_id
        and lessons.published = true
        and (
          lessons.category <> 'individual'
          or lessons.student_id is null
          or lessons.student_id = auth.uid()
        )
    )
  );
