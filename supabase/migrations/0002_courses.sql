-- Módulos, aulas, materiais e progresso dos alunos

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  description text,
  video_path text,
  duration_minutes int,
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  title text not null,
  file_path text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (student_id, lesson_id)
);

alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.materials enable row level security;
alter table public.lesson_progress enable row level security;

-- Módulos
create policy "Alunos veem módulos publicados"
  on public.modules for select
  using (published = true);

create policy "Admin gere módulos"
  on public.modules for all
  using (public.is_admin())
  with check (public.is_admin());

-- Aulas
create policy "Alunos veem aulas publicadas"
  on public.lessons for select
  using (published = true);

create policy "Admin gere aulas"
  on public.lessons for all
  using (public.is_admin())
  with check (public.is_admin());

-- Materiais (segue a visibilidade da aula associada)
create policy "Alunos veem materiais de aulas publicadas"
  on public.materials for select
  using (
    exists (
      select 1 from public.lessons
      where lessons.id = materials.lesson_id and lessons.published = true
    )
  );

create policy "Admin gere materiais"
  on public.materials for all
  using (public.is_admin())
  with check (public.is_admin());

-- Progresso: cada aluno só vê/edita o seu; admin vê tudo
create policy "Aluno vê o próprio progresso"
  on public.lesson_progress for select
  using (student_id = auth.uid());

create policy "Aluno regista o próprio progresso"
  on public.lesson_progress for insert
  with check (student_id = auth.uid());

create policy "Aluno atualiza o próprio progresso"
  on public.lesson_progress for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "Admin vê todo o progresso"
  on public.lesson_progress for select
  using (public.is_admin());
