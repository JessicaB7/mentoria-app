-- Aulas de "acompanhamento individual" sem aluno atribuído passam a ser gerais
-- (ex.: explicar as regras de agendamento das sessões individuais) e ficam
-- visíveis a todos os alunos. Continuam a poder ser atribuídas a um aluno
-- específico — nesse caso ficam visíveis só a esse aluno, como antes.

drop policy "Alunos veem aulas publicadas" on public.lessons;
create policy "Alunos veem aulas publicadas"
  on public.lessons for select
  using (
    published = true
    and (category <> 'individual' or student_id is null or student_id = auth.uid())
  );

drop policy "Alunos veem materiais de aulas publicadas" on public.materials;
create policy "Alunos veem materiais de aulas publicadas"
  on public.materials for select
  using (
    exists (
      select 1 from public.lessons
      where lessons.id = materials.lesson_id
        and lessons.published = true
        and (
          lessons.category <> 'individual'
          or lessons.student_id is null
          or lessons.student_id = auth.uid()
        )
    )
  );

drop policy "Alunos veem gravações de aulas publicadas" on public.session_recordings;
create policy "Alunos veem gravações de aulas publicadas"
  on public.session_recordings for select
  using (
    exists (
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
