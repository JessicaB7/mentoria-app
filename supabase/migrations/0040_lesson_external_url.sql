-- Link externo da aula (ex.: vídeo no YouTube, Vimeo ou Drive). Quando existe,
-- clicar na aula na página do módulo abre este link num separador novo.
alter table public.lessons add column if not exists external_url text;
