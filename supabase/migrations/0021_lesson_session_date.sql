-- Data da sessão para as aulas de acompanhamento individual (ex.: "Sessão 1" → 15/09/2026).

alter table public.lessons add column session_date date;
