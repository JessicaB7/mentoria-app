-- Achado 06 da auditoria: estado de onboarding do aluno, para não
-- perderes o fio a quem está a meio do processo (contrato → entrada →
-- débito direto → ativo). Não replica a assinatura digital nem o
-- GoCardless — continuam a funcionar bem por email; isto é só um
-- checklist.
alter table public.profiles add column if not exists onboarding_status text
  not null default 'convidado'
  check (onboarding_status in ('convidado', 'contrato_enviado', 'entrada_paga', 'debito_ativo', 'ativo'));

-- Alunos já existentes (com data de início definida) já estão ativos —
-- só os novos daqui para a frente começam em "Convidado".
update public.profiles
set onboarding_status = 'ativo'
where role = 'student' and start_date is not null;
