-- Dados de inscrição do aluno: data de início, valor e forma de pagamento

alter table public.profiles add column start_date date;
alter table public.profiles add column mentoria_value numeric(10, 2);
alter table public.profiles add column payment_method text check (payment_method in ('pronto', 'prestacoes'));
