-- Módulos 1 e 2 reformulados: as aulas antigas (ainda sem vídeo, materiais nem
-- progresso) são substituídas pelas novas.
--   Módulo 1: 1. Define o teu nicho  2. Cria a tua proposta de valor
--   Módulo 2: 1. Essenciais no teu perfil  2. Configurar o teu link da bio
--             3. Agendamento de serviços

delete from public.lessons
where module_id in (
  select id from public.modules
  where title in ('Módulo 1 — Posicionamento e Cliente Ideal', 'Módulo 2 — Presença no Instagram')
);

insert into public.lessons (module_id, title, position, published)
select m.id, x.title, x.position, true
from public.modules m
join (values
  ('Módulo 1 — Posicionamento e Cliente Ideal', 'Define o teu nicho', 0),
  ('Módulo 1 — Posicionamento e Cliente Ideal', 'Cria a tua proposta de valor', 1),
  ('Módulo 2 — Presença no Instagram', 'Essenciais no teu perfil', 0),
  ('Módulo 2 — Presença no Instagram', 'Configurar o teu link da bio', 1),
  ('Módulo 2 — Presença no Instagram', 'Agendamento de serviços', 2)
) as x(module_title, title, position) on x.module_title = m.title;

-- Descrições dos módulos alinhadas com as novas aulas.
update public.modules
  set description = 'Define o teu nicho e cria a tua proposta de valor.'
  where title = 'Módulo 1 — Posicionamento e Cliente Ideal';

update public.modules
  set description = 'Os essenciais no teu perfil, o teu link da bio e o agendamento de serviços.'
  where title = 'Módulo 2 — Presença no Instagram';
