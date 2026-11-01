-- Dúvidas para os Hot Seats, enviadas pela página pública /hotseat (não precisa de login).
-- Qualquer pessoa pode enviar; só o admin/mentor lê, marca como respondida e apaga.

create table public.hot_seat_questions (
  id uuid primary key default gen_random_uuid(),
  student_name text not null check (length(trim(student_name)) between 1 and 200),
  question text not null check (length(trim(question)) between 1 and 10000),
  links text check (links is null or length(links) <= 10000),
  -- Preenchido quando a aluna envia com sessão iniciada
  student_id uuid references public.profiles (id) on delete set null,
  answered boolean not null default false,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.hot_seat_questions enable row level security;

create policy "Qualquer pessoa envia dúvidas"
  on public.hot_seat_questions for insert
  to anon, authenticated
  with check (
    answered = false
    and answered_at is null
    and (student_id is null or student_id = auth.uid())
  );

create policy "Admin gere as dúvidas"
  on public.hot_seat_questions for all
  using (public.is_admin())
  with check (public.is_admin());
