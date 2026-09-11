-- Reestruturação do currículo principal (Módulos 1-9), decidida com a mentora:
--   1. Posicionamento e Cliente Ideal        (mantém as lições atuais, só muda o título)
--   2. Presença no Instagram                 (passa a ter as lições de "Crescimento no Instagram")
--   3. Conteúdos a Publicar                  (lições novas)
--   4. Serviço Mensal                        (lições novas)
--   5. Consultoria Individual                (lições novas)
--   6. Serviço Avulso                        (lições novas)
--   7. Infoprodutos                          (lições novas)
--   8. Organização de Clientes               (lições novas)
--   9. Organização e Processos Internos      (módulo novo)
--
-- Os módulos "Fidelização e reputação" e "Escalar o negócio" saem do currículo.

-- 1) As lições de "Módulo 3 — Crescimento no Instagram" mudam-se para
--    "Módulo 2 — Estratégia de conteúdo" (que vai passar a chamar-se "Presença no Instagram").
update public.lessons l
set module_id = m2.id
from public.modules m3, public.modules m2
where l.module_id = m3.id
  and m3.title = 'Módulo 3 — Crescimento no Instagram'
  and m2.title = 'Módulo 2 — Estratégia de conteúdo';

-- 2) As lições antigas de "Módulo 2" (sobre pilares/formatos/calendário) saem —
--    esse conteúdo passa a viver no novo "Módulo 3 — Conteúdos a Publicar".
delete from public.lessons
where module_id = (select id from public.modules where title = 'Módulo 2 — Estratégia de conteúdo')
  and title in (
    'Pilares de conteúdo (educar, autoridade, bastidores, prova social, oferta)',
    'Formatos: Reels, carrosséis, stories, lives, posts estáticos',
    'Calendário editorial e frequência ideal',
    'Banco de ideias e gravação em lote',
    'Reaproveitar 1 conteúdo em 5 formatos diferentes',
    'Ferramentas de edição e agendamento'
  );

-- 3) Módulo 3 (agora "Conteúdos a Publicar"): lições novas.
insert into public.lessons (module_id, title, description, position, published)
select m.id, x.title, x.description, x.position, true
from public.modules m,
(values
  ('Como definir os pilares de conteúdo',
   'Pilares são os temas recorrentes que estruturam o que publicas, para não estares sempre a improvisar. Sugestão: educar, autoridade, bastidores, prova social e oferta. Exercício: escolhe 3 a 5 pilares e define que % de publicações vai para cada um.',
   0),
  ('Como criar a tua lista de ideias de conteúdo',
   'A melhor fonte de ideias são as perguntas que já te fazem (WhatsApp, email, reuniões) — cada dúvida repetida é um post. Outras fontes: prazos fiscais, erros comuns dos clientes, mudanças de lei, mitos sobre impostos. Mantém um banco de ideias com sempre 10-15 em reserva.',
   1),
  ('Tipos de formato',
   'Reel — alcance e descoberta. Carrossel — explicações passo a passo, listas, comparações. Stories — bastidores, enquetes, lembretes de prazos. Post estático — informação que as pessoas querem guardar. A mesma ideia pode ser adaptada a mais do que um formato.',
   2),
  ('Como montar o teu calendário mensal de conteúdo',
   'Planeia com antecedência em vez de decidir todos os dias. Reserva 1 dia por mês para distribuir os temas pelos pilares numa tabela simples (dia / pilar / formato / tema / CTA). Alinha com datas fiscais importantes — é conteúdo sazonal garantido.',
   3),
  ('Automações para converter em clientes',
   'Quando alguém comenta uma palavra-chave num post ou Reel, recebe automaticamente uma DM com um link ou guia — aumenta o engagement e gera contactos sem esforço manual. Ferramenta tipo ManyChat ligada à conta profissional de Instagram; define a palavra-gatilho e a mensagem de DM. Inclui sempre um passo seguinte (ex.: link para marcar chamada).',
   4)
) as x(title, description, position)
where m.title = 'Módulo 3 — Crescimento no Instagram';

-- 4) Módulo 4 (vai passar a "Serviço Mensal"): saem as lições antigas, entram as novas.
delete from public.lessons
where module_id = (select id from public.modules where title = 'Módulo 4 — Atração e conversão de clientes');

insert into public.lessons (module_id, title, description, position, published)
select m.id, x.title, x.description, x.position, true
from public.modules m,
(values
  ('Sessão inicial de orçamento', 'Como conduzir a primeira conversa com um potencial cliente para perceber a necessidade dele e preparar um orçamento.', 0),
  ('Envio da proposta', 'Como estruturar e enviar a proposta comercial de forma profissional, aumentando a taxa de fecho.', 1),
  ('Burocracias', 'Contratos, procurações e documentos legais necessários para arrancar com um novo cliente.', 2),
  ('Faturação e avença', 'Como configurar a faturação recorrente (avença) e gerir os pagamentos mensais.', 3),
  ('Onboarding', 'Recolha de dados, acessos e primeiras tarefas para arrancar com o cliente.', 4),
  ('Tarefas mensais', 'O fluxo de trabalho recorrente: o que fazes, e quando, todos os meses para cada cliente.', 5),
  ('Análise trimestral', 'Como preparar e apresentar uma análise trimestral de resultados ao cliente.', 6)
) as x(title, description, position)
where m.title = 'Módulo 4 — Atração e conversão de clientes';

-- 5) Módulo 5 (vai passar a "Consultoria Individual").
delete from public.lessons
where module_id = (select id from public.modules where title = 'Módulo 5 — Serviços, pacotes e preços');

insert into public.lessons (module_id, title, description, position, published)
select m.id, x.title, x.description, x.position, true
from public.modules m,
(values
  ('Para quem é', 'Quando faz sentido oferecer esta sessão avulsa em vez de (ou além de) uma avença mensal.', 0),
  ('Antes da sessão', 'Como preparar a sessão: recolher as dúvidas do cliente antecipadamente e organizar a agenda.', 1),
  ('Durante a sessão', 'Como conduzir a hora de consultoria para esclarecer todas as dúvidas com eficácia.', 2),
  ('Pós sessão', 'O que enviar ao cliente depois: resumo, próximos passos e documentação.', 3),
  ('Recolha de feedback', 'Como pedir feedback da sessão para melhorares e gerares testemunhos.', 4)
) as x(title, description, position)
where m.title = 'Módulo 5 — Serviços, pacotes e preços';

-- 6) Módulo 6 (vai passar a "Serviço Avulso").
delete from public.lessons
where module_id = (select id from public.modules where title = 'Módulo 6 — Processos e organização de clientes');

insert into public.lessons (module_id, title, description, position, published)
select m.id, x.title, x.description, x.position, true
from public.modules m,
(values
  ('O que é o serviço avulso', 'Serviços pontuais fora da avença mensal, e quando faz sentido oferecê-los.', 0),
  ('Catálogo de serviços pontuais', 'Abertura de atividade, emissão de faturas, guia da segurança social, e outros pedidos comuns.', 1),
  ('Como precificar cada opção', 'Como definir o preço de cada serviço avulso do teu catálogo.', 2)
) as x(title, description, position)
where m.title = 'Módulo 6 — Processos e organização de clientes';

-- 7) Módulo 7 (vai passar a "Infoprodutos").
delete from public.lessons
where module_id = (select id from public.modules where title = 'Módulo 7 — Fidelização e reputação');

insert into public.lessons (module_id, title, description, position, published)
select m.id, x.title, x.description, x.position, true
from public.modules m,
(values
  ('Tipos de infoprodutos', 'As diferentes opções de cursos e formações digitais que podes criar.', 0),
  ('Planeamento e estrutura', 'Como escolher o tema e estruturar módulos e aulas do teu curso.', 1),
  ('Divulgação e venda', 'Como divulgar e vender o teu infoproduto aos teus seguidores e clientes.', 2),
  ('Entrega do produto', 'Como entregar o curso aos alunos depois da compra.', 3)
) as x(title, description, position)
where m.title = 'Módulo 7 — Fidelização e reputação';

-- 8) Módulo 8 (vai passar a "Organização de Clientes").
delete from public.lessons
where module_id = (select id from public.modules where title = 'Módulo 8 — Escalar o negócio');

insert into public.lessons (module_id, title, description, position, published)
select m.id, x.title, x.description, x.position, true
from public.modules m,
(values
  ('Como organizar leads e clientes no CRM da plataforma', 'Organiza leads e clientes num pipeline com estágios, direto na plataforma.', 0),
  ('Como organizar a documentação do cliente', 'Onde e como guardar os documentos de cada cliente de forma organizada.', 1),
  ('Como organizar os dados e enquadramento dos clientes', 'Como manter atualizado o enquadramento fiscal e os dados de cada cliente.', 2),
  ('Gestão de tarefas e prazos por cliente', 'Como não perder prazos, com uma vista clara das tarefas de cada cliente.', 3),
  ('Comunicação com o cliente', 'Como e quando comunicar com o cliente ao longo do mês.', 4),
  ('Satisfação do cliente', 'Como acompanhar e melhorar a satisfação dos teus clientes.', 5)
) as x(title, description, position)
where m.title = 'Módulo 8 — Escalar o negócio';

-- 9) Módulo 9, novo: "Organização e Processos Internos".
with novo_modulo as (
  insert into public.modules (title, description, position, published)
  values ('Módulo 9 — Organização e Processos Internos', 'O funcionamento interno do teu escritório: ferramentas, processos documentados e delegação.', 9, true)
  returning id
)
insert into public.lessons (module_id, title, description, position, published)
select novo_modulo.id, x.title, x.description, x.position, true
from novo_modulo,
(values
  ('Ferramentas de gestão do teu negócio', 'Agenda, tarefas e documentos: as ferramentas para geres o teu escritório.', 0),
  ('Como documentar os teus processos (SOPs)', 'Como criar procedimentos escritos para não dependeres só da tua memória.', 1),
  ('Rotina semanal/mensal do escritório', 'Como estruturar a tua semana e o teu mês para dares conta de tudo.', 2),
  ('Quando e como delegar/contratar', 'Sinais de que é hora de contratar, e como começar a delegar.', 3)
) as x(title, description, position);

-- 10) Por fim, os títulos e descrições dos módulos 1-8 (o Módulo 1 só muda o título,
--     como pedido — a descrição fica como estava).
update public.modules set title = 'Módulo 1 — Posicionamento e Cliente Ideal'
  where title = 'Módulo 1 — Posicionamento e marca pessoal';

update public.modules
  set title = 'Módulo 2 — Presença no Instagram',
      description = 'Como funciona o algoritmo, hashtags, engagement e Reels para apareceres a quem procura um contabilista.'
  where title = 'Módulo 2 — Estratégia de conteúdo';

update public.modules
  set title = 'Módulo 3 — Conteúdos a Publicar',
      description = 'Pilares, ideias, formatos e calendário — o que publicar todos os meses, e as automações que convertem seguidores em contactos.'
  where title = 'Módulo 3 — Crescimento no Instagram';

update public.modules
  set title = 'Módulo 4 — Serviço Mensal',
      description = 'Do primeiro contacto à faturação: como conduzir todo o processo do teu serviço de contabilidade mensal (avença).'
  where title = 'Módulo 4 — Atração e conversão de clientes';

update public.modules
  set title = 'Módulo 5 — Consultoria Individual',
      description = 'Sessões de 1 hora com um contabilista certificado para esclarecer dúvidas pontuais dos clientes.'
  where title = 'Módulo 5 — Serviços, pacotes e preços';

update public.modules
  set title = 'Módulo 6 — Serviço Avulso',
      description = 'Serviços pontuais fora da avença mensal — abertura de atividade, faturas, segurança social — e como apresentá-los e cobrá-los.'
  where title = 'Módulo 6 — Processos e organização de clientes';

update public.modules
  set title = 'Módulo 7 — Infoprodutos',
      description = 'Como criar e vender cursos e formações digitais para escalar a tua receita sem vender mais horas.'
  where title = 'Módulo 7 — Fidelização e reputação';

update public.modules
  set title = 'Módulo 8 — Organização de Clientes',
      description = 'Organiza leads, documentação e comunicação com os teus clientes no CRM da plataforma.'
  where title = 'Módulo 8 — Escalar o negócio';
