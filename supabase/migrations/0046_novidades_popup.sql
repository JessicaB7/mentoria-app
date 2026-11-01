-- Pop-up de novidades para os alunos: quando uma aula ou módulo fica disponível,
-- aparece ao abrir a app até o aluno o fechar.

-- 1. Data em que a aula/módulo ficou visível (passou a "publicado").
alter table public.lessons add column published_at timestamptz;
alter table public.modules add column published_at timestamptz;

update public.lessons set published_at = created_at where published and published_at is null;
update public.modules set published_at = created_at where published and published_at is null;

create or replace function public.set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.published and (tg_op = 'INSERT' or not coalesce(old.published, false)) then
    new.published_at := now();
  elsif not new.published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create trigger lessons_set_published_at
  before insert or update of published on public.lessons
  for each row execute function public.set_published_at();

create trigger modules_set_published_at
  before insert or update of published on public.modules
  for each row execute function public.set_published_at();

-- 2. Até quando o aluno já viu as novidades (null = ainda nunca abriu a app desde esta funcionalidade).
alter table public.profiles add column content_seen_at timestamptz;
