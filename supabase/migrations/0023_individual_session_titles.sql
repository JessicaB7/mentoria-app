-- Nomes completos das sessões de acompanhamento individual.
update public.lessons
set title = 'Sessão 1 - Onboarding Mentoria'
where category = 'individual' and title = 'Sessão 1';

update public.lessons
set title = 'Sessão 2 - após 3 meses do início da mentoria'
where category = 'individual' and title = 'Sessão 2';

update public.lessons
set title = 'Sessão 3 - após 6 meses do início da mentoria'
where category = 'individual' and title = 'Sessão 3';
