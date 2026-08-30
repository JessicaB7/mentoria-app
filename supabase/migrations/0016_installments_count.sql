-- Número de prestações, para quando o método de pagamento é "prestações"

alter table public.profiles add column installments_count int;
alter table public.crm_contacts add column installments_count int;
