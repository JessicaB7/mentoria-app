-- Texto da secção "Onboarding" no Acompanhamento Individual, replicando
-- os 5 passos que estavam na "Mensagem de Onboarding" do Notion.
insert into public.app_settings (key, value) values
  ('onboarding_section_text',
   '**1. Assinatura do Contrato**
Recebes o contrato da mentoria por email — lê com atenção, confirma que os dados estão corretos e assina com a Assinatura Digital do Cartão de Cidadão, em autenticacao.gov.pt/cmd-assinatura. Depois de assinado, reenvia por email.

**2. Pagamento da Entrada**
Garante a tua inscrição — a fazer no prazo de 24h após a assinatura do contrato. Valor e IBAN estão no contrato.

**3. Ativação do Débito Direto**
Depois do pagamento da entrada, ativa a autorização de débito direto para as tuas mensalidades, através do link enviado por email.

**4. Formulário de Check-out**
Preenches os teus dados finais, para prepararmos o teu Plano Individual de Implementação.

**5. Marcação da Sessão de Onboarding**
Depois de todos os passos anteriores cumpridos, marcamos juntas a tua sessão de onboarding — aí mostro-te como tudo funciona.')
on conflict (key) do nothing;
