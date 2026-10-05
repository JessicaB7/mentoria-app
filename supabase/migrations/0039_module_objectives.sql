-- Objetivo de cada módulo: um texto inicial e a lista do que a aluna consegue no fim.
-- Aparece no topo da página do módulo e é editável no admin ("Editar módulo").

alter table public.modules add column if not exists objective text;
alter table public.modules add column if not exists outcomes text[] not null default '{}';

update public.modules set
  objective = 'Este é o ponto de partida da tua mentoria. Vais perceber como está organizado o programa, como tirar o máximo partido das aulas, das sessões e da comunidade, e fazer um diagnóstico honesto do ponto em que está o teu negócio hoje — para sabermos exatamente de onde partimos.',
  outcomes = array[
    'Saber como funciona a mentoria e onde encontrar cada recurso',
    'Ter o diagnóstico do teu negócio feito',
    'Conhecer o teu ponto de partida para medir a tua evolução'
  ]
where title = 'Módulo 0 — Onboarding';

update public.modules set
  objective = 'Antes de comunicar, tens de saber para quem falas e porque és a escolha certa. Neste módulo defines o teu nicho e constróis uma proposta de valor clara, que te diferencia dos outros contabilistas e torna fácil ao cliente ideal perceber que és tu quem procura.',
  outcomes = array[
    'Ter o teu nicho e cliente ideal bem definidos',
    'Ter uma proposta de valor clara, numa frase',
    'Saber explicar em poucos segundos o que fazes e para quem'
  ]
where title = 'Módulo 1 — Posicionamento e Cliente Ideal';

update public.modules set
  objective = 'O teu Instagram é a montra do teu escritório. Neste módulo preparas o perfil para transmitir confiança e converter visitas em contactos: os essenciais do perfil, um link da bio que encaminha o cliente e um sistema de agendamento para marcarem contigo sem trocas de mensagens.',
  outcomes = array[
    'Ter o perfil de Instagram otimizado para o teu cliente ideal',
    'Ter o link da bio configurado e a encaminhar para os teus serviços',
    'Ter o agendamento de serviços a funcionar'
  ]
where title = 'Módulo 2 — Presença no Instagram';

update public.modules set
  objective = 'Publicar sem plano cansa e não traz clientes. Aqui crias um sistema de conteúdo: os teus pilares, uma lista de ideias que não acaba, os formatos certos para cada objetivo, um calendário mensal e automações que transformam seguidores em contactos.',
  outcomes = array[
    'Ter os teus pilares de conteúdo definidos',
    'Ter uma lista de ideias e o calendário do próximo mês',
    'Ter automações a converter seguidores em contactos'
  ]
where title = 'Módulo 3 — Conteúdos a Publicar';

update public.modules set
  objective = 'A avença mensal é a base de um escritório estável. Neste módulo percorres todo o processo, do primeiro contacto à faturação: a sessão de orçamento, a proposta, as burocracias, a entrada do cliente, as tarefas de cada mês e a análise trimestral.',
  outcomes = array[
    'Conduzir uma sessão de orçamento com confiança',
    'Enviar propostas claras e fechar avenças',
    'Ter um processo mensal e trimestral organizado para cada cliente'
  ]
where title = 'Módulo 4 — Serviço Mensal';

update public.modules set
  objective = 'A consultoria individual é uma forma rápida de ajudar clientes com dúvidas pontuais e de gerar receita sem compromisso mensal. Aprendes para quem é, como preparar, conduzir e fechar cada sessão, e como recolher feedback para melhorar.',
  outcomes = array[
    'Saber a quem propor uma consultoria individual',
    'Ter um guião para antes, durante e depois da sessão',
    'Recolher feedback e transformar sessões em clientes recorrentes'
  ]
where title = 'Módulo 5 — Consultoria Individual';

update public.modules set
  objective = 'Nem todos os clientes precisam de uma avença. Neste módulo organizas os serviços pontuais — abertura de atividade, faturas, segurança social e outros — num catálogo claro, com preços pensados, para os apresentares e cobrares sem hesitar.',
  outcomes = array[
    'Ter o teu catálogo de serviços avulsos',
    'Ter um preço definido para cada serviço',
    'Saber apresentar e cobrar serviços pontuais'
  ]
where title = 'Módulo 6 — Serviço Avulso';

update public.modules set
  objective = 'Os infoprodutos permitem-te ajudar mais pessoas e aumentar a receita sem vender mais horas. Vais conhecer os tipos de infoproduto, planear e estruturar o teu, e preparar a divulgação, a venda e a entrega.',
  outcomes = array[
    'Escolher o infoproduto certo para o teu público',
    'Ter a estrutura do teu infoproduto planeada',
    'Ter um plano de divulgação, venda e entrega'
  ]
where title = 'Módulo 7 — Infoprodutos';

update public.modules set
  objective = 'Com mais clientes, a organização deixa de ser opcional. Aqui aprendes a gerir leads e clientes no CRM da plataforma, a organizar documentação e dados, a controlar tarefas e prazos, e a comunicar de forma a manter os clientes satisfeitos.',
  outcomes = array[
    'Ter leads e clientes organizados no CRM',
    'Ter a documentação e os prazos de cada cliente sob controlo',
    'Ter uma comunicação regular que aumenta a satisfação'
  ]
where title = 'Módulo 8 — Organização de Clientes';

update public.modules set
  objective = 'Um escritório que cresce precisa de processos. Neste módulo escolhes as ferramentas de gestão, documentas os teus processos, defines a rotina semanal e mensal, e percebes quando e como delegar ou contratar.',
  outcomes = array[
    'Ter as ferramentas de gestão do teu negócio definidas',
    'Ter os teus processos principais documentados',
    'Saber quando e como delegar ou contratar'
  ]
where title = 'Módulo 9 — Organização e Processos Internos';
