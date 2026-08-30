-- Financeiro: registo de pagamentos recebidos de cada aluno

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10, 2) not null,
  paid_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Admin gere pagamentos"
  on public.payments for all
  using (public.is_admin())
  with check (public.is_admin());
