-- CRM: data/hora da reunião e valor associado ao contacto

alter table public.crm_contacts add column meeting_date date;
alter table public.crm_contacts add column meeting_time time;
alter table public.crm_contacts add column value numeric(10, 2);
