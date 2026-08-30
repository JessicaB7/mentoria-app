-- CRM: método de pagamento e prazo combinados com o lead

alter table public.crm_contacts add column payment_method text
  check (payment_method in ('pronto', 'prestacoes'));
alter table public.crm_contacts add column payment_term text;
