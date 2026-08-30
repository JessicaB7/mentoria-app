-- Categoria dos módulos: "modulo" (currículo principal) vs "individual" (acompanhamento 1:1)

alter table public.modules add column category text not null default 'modulo' check (category in ('modulo', 'individual'));

update public.modules set category = 'individual'
where title in ('Módulo 9 — Plano de ação e bónus', 'Módulo 11 — Sessões Individuais');
