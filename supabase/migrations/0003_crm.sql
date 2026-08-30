-- CRM: contactos/leads, pipeline e tarefas de follow-up (uso exclusivo do admin)

create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  source text,
  stage text not null default 'lead'
    check (stage in ('lead', 'contacted', 'proposal', 'won', 'lost')),
  notes text,
  student_id uuid references public.profiles (id) on delete set null,
  owner_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.crm_contacts (id) on delete cascade,
  title text not null,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'done')),
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.crm_contacts enable row level security;
alter table public.crm_tasks enable row level security;

create policy "Admin gere contactos CRM"
  on public.crm_contacts for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin gere tarefas CRM"
  on public.crm_tasks for all
  using (public.is_admin())
  with check (public.is_admin());

-- Mantém updated_at atualizado
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger crm_contacts_set_updated_at
  before update on public.crm_contacts
  for each row execute function public.set_updated_at();
