-- Currículo inicial da mentoria: módulos e aulas

with new_modules as (
  insert into public.modules (title, description, position, published, cover_path) values
    ('Módulo 0 — Onboarding e mentalidade', 'Como aproveitar a mentoria, mudança de mentalidade e o teu plano de arranque.', 0, true, 'module-0.svg'),
    ('Módulo 1 — Posicionamento e marca pessoal', 'Define o teu nicho, a tua proposta de valor e otimiza o teu Instagram.', 1, true, 'module-1.svg'),
    ('Módulo 2 — Estratégia de conteúdo', 'Pilares de conteúdo, formatos, calendário editorial e produção em lote.', 2, true, 'module-2.svg'),
    ('Módulo 3 — Crescimento no Instagram', 'Algoritmo, hashtags, engagement e Reels que atraem os seguidores certos.', 3, true, 'module-3.svg'),
    ('Módulo 4 — Atração e conversão de clientes', 'Funil de vendas no Instagram, copywriting e scripts de resposta a leads.', 4, true, 'module-4.svg'),
    ('Módulo 5 — Serviços, pacotes e preços', 'Estrutura de pacotes, precificação e propostas que fecham negócio.', 5, true, 'module-5.svg'),
    ('Módulo 6 — Processos e organização de clientes', 'Pipeline de clientes, onboarding e fluxos de trabalho recorrentes.', 6, true, 'module-6.svg'),
    ('Módulo 7 — Fidelização e reputação', 'Atendimento, testemunhos, referências e redução de churn.', 7, true, 'module-7.svg'),
    ('Módulo 8 — Escalar o negócio', 'Métricas, contratação, novos canais e diversificação de receita.', 8, true, 'module-8.svg'),
    ('Módulo 9 — Plano de ação e bónus', 'O teu plano de 90 dias e o kit de templates da mentoria.', 9, true, 'module-9.svg'),
    ('Módulo 10 — Hot Seats', 'Sessões de grupo ao vivo onde trazes o teu caso real para seres ajudado(a) a resolvê-lo em conjunto.', 10, true, 'module-10.svg'),
    ('Módulo 11 — Sessões Individuais', 'Acompanhamento 1:1 focado nos teus objetivos e desafios específicos.', 11, true, 'module-11.svg')
  returning id, title
)
insert into public.lessons (module_id, title, position, published)
select nm.id, l.title, l.position, true
from new_modules nm
join (values
  ('Módulo 0 — Onboarding e mentalidade', 'Boas-vindas e como aproveitar a mentoria', 0),
  ('Módulo 0 — Onboarding e mentalidade', 'Mudança de mentalidade: de técnico a empreendedor', 1),
  ('Módulo 0 — Onboarding e mentalidade', 'Diagnóstico inicial: onde estás agora', 2),
  ('Módulo 0 — Onboarding e mentalidade', 'Definir objetivos e o teu plano de 90 dias', 3),

  ('Módulo 1 — Posicionamento e marca pessoal', 'Definir o teu nicho (setor, dimensão de empresa, tipo de cliente)', 0),
  ('Módulo 1 — Posicionamento e marca pessoal', 'Arquétipo de marca: como queres ser percecionado', 1),
  ('Módulo 1 — Posicionamento e marca pessoal', 'Proposta de valor e mensagem-chave', 2),
  ('Módulo 1 — Posicionamento e marca pessoal', 'Otimizar o perfil de Instagram (bio, destaques, feed, estética)', 3),
  ('Módulo 1 — Posicionamento e marca pessoal', 'Tom de voz e identidade visual', 4),

  ('Módulo 2 — Estratégia de conteúdo', 'Pilares de conteúdo (educar, autoridade, bastidores, prova social, oferta)', 0),
  ('Módulo 2 — Estratégia de conteúdo', 'Formatos: Reels, carrosséis, stories, lives, posts estáticos', 1),
  ('Módulo 2 — Estratégia de conteúdo', 'Calendário editorial e frequência ideal', 2),
  ('Módulo 2 — Estratégia de conteúdo', 'Banco de ideias e gravação em lote', 3),
  ('Módulo 2 — Estratégia de conteúdo', 'Reaproveitar 1 conteúdo em 5 formatos diferentes', 4),
  ('Módulo 2 — Estratégia de conteúdo', 'Ferramentas de edição e agendamento', 5),

  ('Módulo 3 — Crescimento no Instagram', 'Como funciona o algoritmo (o que importa em 2026)', 0),
  ('Módulo 3 — Crescimento no Instagram', 'Hashtags, SEO no Instagram e descoberta', 1),
  ('Módulo 3 — Crescimento no Instagram', 'Estratégias de engagement (comentar, colaborar, trends)', 2),
  ('Módulo 3 — Crescimento no Instagram', 'Reels virais: gancho, desenvolvimento, CTA', 3),
  ('Módulo 3 — Crescimento no Instagram', 'Orgânico vs. tráfego pago (quando investir em ads)', 4),

  ('Módulo 4 — Atração e conversão de clientes', 'Funil no Instagram: do seguidor ao lead', 0),
  ('Módulo 4 — Atração e conversão de clientes', 'CTAs e como gerar contactos (DMs, formulário, link na bio)', 1),
  ('Módulo 4 — Atração e conversão de clientes', 'Copywriting que vende (posts, stories, legendas)', 2),
  ('Módulo 4 — Atração e conversão de clientes', 'Scripts de resposta a DMs e perguntas frequentes', 3),
  ('Módulo 4 — Atração e conversão de clientes', 'Gestão de objeções e primeiro contacto', 4),
  ('Módulo 4 — Atração e conversão de clientes', 'Regras de publicidade para contabilistas certificados (OCC)', 5),

  ('Módulo 5 — Serviços, pacotes e preços', 'Estruturar pacotes de contabilidade (o que incluir em cada nível)', 0),
  ('Módulo 5 — Serviços, pacotes e preços', 'Modelos de precificação (fixo, à hora, por volume)', 1),
  ('Módulo 5 — Serviços, pacotes e preços', 'Calcular o teu preço mínimo viável', 2),
  ('Módulo 5 — Serviços, pacotes e preços', 'Propostas profissionais que fecham negócio', 3),
  ('Módulo 5 — Serviços, pacotes e preços', 'Upsell e cross-sell de serviços adicionais', 4),

  ('Módulo 6 — Processos e organização de clientes', 'Organizar leads e clientes num pipeline (o CRM da plataforma)', 0),
  ('Módulo 6 — Processos e organização de clientes', 'Onboarding do novo cliente: checklist e documentos', 1),
  ('Módulo 6 — Processos e organização de clientes', 'Fluxos recorrentes (mensal, trimestral, anual) por cliente', 2),
  ('Módulo 6 — Processos e organização de clientes', 'Ferramentas de gestão de tarefas e prazos', 3),
  ('Módulo 6 — Processos e organização de clientes', 'Templates e follow-ups automáticos', 4),
  ('Módulo 6 — Processos e organização de clientes', 'Lidar com clientes difíceis ou em atraso', 5),

  ('Módulo 7 — Fidelização e reputação', 'Padrões de comunicação e atendimento ao cliente', 0),
  ('Módulo 7 — Fidelização e reputação', 'Pedir referências e testemunhos', 1),
  ('Módulo 7 — Fidelização e reputação', 'Criar um programa de indicação', 2),
  ('Módulo 7 — Fidelização e reputação', 'Gerir a reputação online', 3),
  ('Módulo 7 — Fidelização e reputação', 'Reduzir o churn: sinais de alerta e como agir', 4),

  ('Módulo 8 — Escalar o negócio', 'Métricas-chave (seguidores, leads, conversão, LTV, CAC)', 0),
  ('Módulo 8 — Escalar o negócio', 'Quando e como contratar/delegar', 1),
  ('Módulo 8 — Escalar o negócio', 'Outros canais: LinkedIn, WhatsApp Business, email, parcerias', 2),
  ('Módulo 8 — Escalar o negócio', 'Construir equipa mantendo a marca', 3),
  ('Módulo 8 — Escalar o negócio', 'Diversificar receita (infoprodutos, consultoria, formações)', 4),

  ('Módulo 9 — Plano de ação e bónus', 'O teu plano de 90 dias personalizado', 0),
  ('Módulo 9 — Plano de ação e bónus', 'Kit de templates (calendário, scripts de DM, proposta, tabela de preços)', 1),
  ('Módulo 9 — Plano de ação e bónus', 'Casos de estudo reais', 2),
  ('Módulo 9 — Plano de ação e bónus', 'Sessões de Q&A / comunidade', 3),

  ('Módulo 10 — Hot Seats', 'Como funcionam os Hot Seats', 0),
  ('Módulo 10 — Hot Seats', 'Como preparar o teu caso para a sessão', 1),
  ('Módulo 10 — Hot Seats', 'Calendário das sessões em grupo', 2),

  ('Módulo 11 — Sessões Individuais', 'Como agendar a tua sessão 1:1', 0),
  ('Módulo 11 — Sessões Individuais', 'O que preparar antes da sessão', 1),
  ('Módulo 11 — Sessões Individuais', 'Como aproveitar ao máximo o acompanhamento individual', 2)
) as l(module_title, title, position) on l.module_title = nm.title;
