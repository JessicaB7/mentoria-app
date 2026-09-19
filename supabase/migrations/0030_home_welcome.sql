-- Mensagem de boas-vindas na página de Início do aluno, inspirada na
-- área de mentorada da Tertullia.
insert into public.app_settings (key, value) values
  ('home_mentoria_name', 'Contabilista Explica'),
  ('home_welcome_body',
   'Aqui encontrarás toda a informação relacionada à tua jornada dentro da mentoria.
Deverás ir documentando por aqui todos os teus passos para que eu saiba em que ponto de situação estás e de que forma te poderei ajudar em cada uma das várias fases.')
on conflict (key) do nothing;
