-- Diagnóstico inicial completo, replicando o formulário "Check-in
-- Mentoria" do Notion da Contabilista Explica.
alter table public.profiles add column if not exists current_services text;
alter table public.profiles add column if not exists challenges text[];
alter table public.profiles add column if not exists other_challenges text;
alter table public.profiles add column if not exists enrollment_reason text;
alter table public.profiles add column if not exists success_definition text;
alter table public.profiles add column if not exists learning_goals text;
alter table public.profiles add column if not exists additional_notes text;

-- Canal de pagamento simplificado: só transferência bancária ou GoCardless.
alter table public.profiles drop constraint if exists profiles_payment_channel_check;
update public.profiles set payment_channel = 'gocardless' where payment_channel = 'debito_direto';
-- 'stripe' não mapeia claramente para nenhum dos dois — fica por preencher de novo.
update public.profiles set payment_channel = null where payment_channel = 'stripe';
alter table public.profiles add constraint profiles_payment_channel_check
  check (payment_channel in ('transferencia', 'gocardless'));
