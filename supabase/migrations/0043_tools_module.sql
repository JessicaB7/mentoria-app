-- Materiais de aula: uma ferramenta pode ficar associada a um módulo.
-- Com módulo aparece na secção "Materiais Aulas", agrupada por módulo; sem módulo continua nas ferramentas normais.

alter table public.tools
  add column module_id uuid references public.modules (id) on delete set null;

create index tools_module_id_idx on public.tools (module_id);
