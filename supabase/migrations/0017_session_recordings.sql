-- Gravações de sessões ao vivo: várias entradas (título + link externo) por aula,
-- para as aulas "ao vivo" (ex.: Hot Seats) poderem ter uma gravação por sessão.

create table public.session_recordings (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  title text not null,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.session_recordings enable row level security;

-- Segue a mesma visibilidade da aula associada (materials.ts)
create policy "Alunos veem gravações de aulas publicadas"
  on public.session_recordings for select
  using (
    exists (
      select 1 from public.lessons
      where lessons.id = session_recordings.lesson_id
        and lessons.published = true
        and (lessons.category <> 'individual' or lessons.student_id = auth.uid())
    )
  );

create policy "Admin gere gravações"
  on public.session_recordings for all
  using (public.is_admin())
  with check (public.is_admin());
