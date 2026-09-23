-- Data de cada gravação de sessão ao vivo, para a galeria de gravações
-- (uma aula como "Hot Seat" pode ter várias sessões, cada uma com a sua data).

alter table public.session_recordings add column session_date date;
