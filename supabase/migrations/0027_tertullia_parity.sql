-- Inspirado na área de mentorada da Tertullia (auditoria de 19/09/2026):
-- ciclo com data de fim, plano de ação vivo, espaço de entregáveis do
-- aluno e feedback de saída/renovação.

-- 08. Ciclo com fim previsto + notas de prorrogação
alter table public.profiles add column if not exists end_date date;
alter table public.profiles add column if not exists cycle_notes text;

-- 10. Plano de ação vivo (objetivos com estado e prazo, editável pelo aluno)
create table if not exists public.student_goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  status text not null default 'por_comecar'
    check (status in ('por_comecar', 'em_andamento', 'concluido')),
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.student_goals enable row level security;

drop policy if exists "Aluno vê os próprios objetivos" on public.student_goals;
create policy "Aluno vê os próprios objetivos"
  on public.student_goals for select
  using (student_id = auth.uid());

drop policy if exists "Aluno atualiza o estado dos próprios objetivos" on public.student_goals;
create policy "Aluno atualiza o estado dos próprios objetivos"
  on public.student_goals for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists "Admin gere objetivos" on public.student_goals;
create policy "Admin gere objetivos"
  on public.student_goals for all
  using (public.is_admin())
  with check (public.is_admin());

-- 12. Espaço de entregáveis (o aluno documenta trabalho; o mentor acompanha)
create table if not exists public.student_deliverables (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  url text not null,
  status text not null default 'em_analise'
    check (status in ('em_analise', 'revisto')),
  created_at timestamptz not null default now()
);

alter table public.student_deliverables enable row level security;

drop policy if exists "Aluno vê os próprios entregáveis" on public.student_deliverables;
create policy "Aluno vê os próprios entregáveis"
  on public.student_deliverables for select
  using (student_id = auth.uid());

drop policy if exists "Aluno adiciona os próprios entregáveis" on public.student_deliverables;
create policy "Aluno adiciona os próprios entregáveis"
  on public.student_deliverables for insert
  with check (student_id = auth.uid());

drop policy if exists "Aluno remove os próprios entregáveis" on public.student_deliverables;
create policy "Aluno remove os próprios entregáveis"
  on public.student_deliverables for delete
  using (student_id = auth.uid());

drop policy if exists "Admin gere entregáveis" on public.student_deliverables;
create policy "Admin gere entregáveis"
  on public.student_deliverables for all
  using (public.is_admin())
  with check (public.is_admin());

-- 13. Feedback de saída/renovação
create table if not exists public.student_feedback (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.student_feedback enable row level security;

drop policy if exists "Aluno vê o próprio feedback" on public.student_feedback;
create policy "Aluno vê o próprio feedback"
  on public.student_feedback for select
  using (student_id = auth.uid());

drop policy if exists "Aluno regista o próprio feedback" on public.student_feedback;
create policy "Aluno regista o próprio feedback"
  on public.student_feedback for insert
  with check (student_id = auth.uid());

drop policy if exists "Admin vê todo o feedback" on public.student_feedback;
create policy "Admin vê todo o feedback"
  on public.student_feedback for select
  using (public.is_admin());
