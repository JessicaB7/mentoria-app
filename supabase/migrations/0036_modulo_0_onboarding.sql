-- Módulo 0 passa a chamar-se "Onboarding" e fica só com duas aulas:
--   1. Boas-vindas e como aproveitar a mentoria
--   2. Diagnóstico inicial: onde estás agora
-- Se o módulo já existir (com o título antigo ou o novo), é atualizado;
-- se não existir, é criado.

-- 1) Renomeia o módulo, se existir.
update public.modules
  set title = 'Módulo 0 — Onboarding',
      description = 'Como aproveitar a mentoria e o diagnóstico do ponto de partida do teu negócio.',
      position = 0,
      published = true
  where title in ('Módulo 0 — Onboarding e mentalidade', 'Módulo 0 — Onboarding');

-- 2) Cria-o, se não existir.
insert into public.modules (title, description, position, published)
select 'Módulo 0 — Onboarding',
       'Como aproveitar a mentoria e o diagnóstico do ponto de partida do teu negócio.',
       0, true
where not exists (select 1 from public.modules where title = 'Módulo 0 — Onboarding');

-- 3) Substitui as aulas do módulo pelas duas que ficam.
delete from public.lessons
where module_id = (select id from public.modules where title = 'Módulo 0 — Onboarding');

insert into public.lessons (module_id, title, position, published)
select m.id, x.title, x.position, true
from public.modules m,
(values
  ('Boas-vindas e como aproveitar a mentoria', 0),
  ('Diagnóstico inicial: onde estás agora', 1)
) as x(title, position)
where m.title = 'Módulo 0 — Onboarding';
