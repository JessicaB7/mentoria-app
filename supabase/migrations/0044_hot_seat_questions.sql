-- Dúvidas que os alunos enviam para serem respondidas nos Hot Seats.
-- O aluno envia e vê as suas; o admin/mentor vê todas e marca-as como respondidas.

create table public.hot_seat_questions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  topic text not null,
  situation text not null check (length(trim(situation)) > 0),
  tried text,
  goal text not null check (length(trim(goal)) > 0),
  session_date date,
  answered boolean not null default false,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index hot_seat_questions_student_id_idx on public.hot_seat_questions (student_id);

alter table public.hot_seat_questions enable row level security;

create policy "Aluno vê as próprias dúvidas"
  on public.hot_seat_questions for select
  using (student_id = auth.uid());

create policy "Aluno envia dúvidas"
  on public.hot_seat_questions for insert
  with check (student_id = auth.uid() and answered = false);

create policy "Aluno apaga dúvidas por responder"
  on public.hot_seat_questions for delete
  using (student_id = auth.uid() and answered = false);

create policy "Admin gere as dúvidas"
  on public.hot_seat_questions for all
  using (public.is_admin())
  with check (public.is_admin());
