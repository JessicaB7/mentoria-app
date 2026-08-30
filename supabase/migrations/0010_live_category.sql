-- Nova categoria "ao_vivo" (Aulas ao vivo) — o Hot Seats muda para lá

alter table public.modules drop constraint modules_category_check;
alter table public.modules add constraint modules_category_check
  check (category in ('modulo', 'individual', 'ao_vivo'));

update public.modules set category = 'ao_vivo'
where title = 'Módulo 10 — Hot Seats';
