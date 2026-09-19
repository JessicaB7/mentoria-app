-- Campos identificados na auditoria ao Notion (faturação, canal de
-- pagamento, diagnóstico inicial do aluno, e sessões especiais).

-- Faturação
alter table public.profiles add column if not exists tax_id text;

-- Canal de recebimento, distinto do tipo de plano (pronto/prestações)
alter table public.profiles add column if not exists payment_channel text
  check (payment_channel in ('transferencia', 'stripe', 'debito_direto'));

-- Diagnóstico inicial estruturado (substitui parcialmente o texto livre)
alter table public.profiles add column if not exists business_type text
  check (business_type in ('independente', 'empresa', 'ainda_nao_comecei'));
alter table public.profiles add column if not exists business_area text;
alter table public.profiles add column if not exists current_clients text;
alter table public.profiles add column if not exists biggest_challenge text;

-- Sessões especiais (boas-vindas, convidado, encerramento, presencial)
alter table public.lessons add column if not exists session_type text
  check (session_type in ('boas_vindas', 'convidado', 'encerramento', 'presencial'));
