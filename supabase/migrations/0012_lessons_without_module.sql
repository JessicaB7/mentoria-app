-- Aulas ao vivo e acompanhamento individual deixam de precisar de um módulo.
-- O acompanhamento individual passa a ser atribuído a um aluno específico.

alter table public.lessons add column category text not null default 'modulo'
  check (category in ('modulo', 'individual', 'ao_vivo'));
alter table public.lessons add column student_id uuid references public.profiles (id) on delete set null;
alter table public.lessons alter column module_id drop not null;

-- Herda a categoria do módulo atual
update public.lessons l
set category = m.category
from public.modules m
where m.id = l.module_id;

-- Desliga as aulas "ao vivo" e "individual" do módulo que as continha
update public.lessons
set module_id = null
where category in ('ao_vivo', 'individual');

-- Os módulos que só existiam para agrupar essas aulas deixam de ser precisos
delete from public.modules where category in ('ao_vivo', 'individual');

-- Só módulos "modulo" continuam a existir daqui para a frente
alter table public.modules drop constraint modules_category_check;
alter table public.modules drop column category;

-- Uma aula do currículo principal continua a precisar de um módulo
alter table public.lessons add constraint lessons_modulo_requires_module
  check (category <> 'modulo' or module_id is not null);

-- RLS: aulas "individual" só ficam visíveis para o aluno atribuído
drop policy "Alunos veem aulas publicadas" on public.lessons;
create policy "Alunos veem aulas publicadas"
  on public.lessons for select
  using (
    published = true
    and (category <> 'individual' or student_id = auth.uid())
  );

drop policy "Alunos veem materiais de aulas publicadas" on public.materials;
create policy "Alunos veem materiais de aulas publicadas"
  on public.materials for select
  using (
    exists (
      select 1 from public.lessons
      where lessons.id = materials.lesson_id
        and lessons.published = true
        and (lessons.category <> 'individual' or lessons.student_id = auth.uid())
    )
  );
