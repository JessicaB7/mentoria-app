-- Valor de entrada pago antes das prestações (ex.: aluno paga uma entrada e
-- depois o restante é dividido em prestações mensais). Usado no plano de
-- pagamentos mensal para calcular corretamente o valor e a data de cada
-- prestação quando há entrada.
alter table public.profiles add column if not exists down_payment numeric;
