-- Adiciona número de telefone ao perfil do aluno

alter table public.profiles add column phone text;

-- Passa a preencher o telefone (vindo dos metadados do utilizador) na criação do perfil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'phone',
    'student'
  );
  return new;
end;
$$;
