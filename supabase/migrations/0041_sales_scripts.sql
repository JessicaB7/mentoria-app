-- Scripts comerciais (chamadas, propostas, follow-ups) na secção Comercial.
-- Reutilizam a tabela e o bucket dos conteúdos da mentora: só a equipa vê.

alter table public.mentor_contents drop constraint mentor_contents_kind_check;
alter table public.mentor_contents
  add constraint mentor_contents_kind_check
  check (kind in ('slides', 'ferramentas', 'scripts', 'comercial'));
