-- Definições globais e editáveis da app (texto/copy livre, sem precisar de
-- alterar código nem base de dados para cada novo texto).
create table public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

create policy "Todos veem definições"
  on public.app_settings for select
  using (true);

create policy "Admin gere definições"
  on public.app_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Valores iniciais do texto de introdução do Acompanhamento Individual
-- (os mesmos que já estavam fixos no código).
insert into public.app_settings (key, value) values
  ('individual_intro_text',
   'Este é o teu espaço de **acompanhamento individual** — sessões 1:1 pensadas exclusivamente para o teu negócio e para os desafios do teu dia a dia como contabilista.

Aqui vais encontrar cada sessão, com o resumo, os materiais partilhados e os próximos passos combinados. Antes do próximo encontro, vale a pena rever a sessão anterior para chegares com tudo fresco.'),
  ('individual_intro_quote',
   'Grandes negócios não nascem de grandes saltos — nascem de pequenos passos consistentes, sessão após sessão.');
