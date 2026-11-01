-- 1. Realtime em hot_seat_questions: o admin recebe um popup quando chega uma dúvida nova.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hot_seat_questions'
  ) then
    alter publication supabase_realtime add table public.hot_seat_questions;
  end if;
end $$;

-- 2. "As minhas dúvidas": a aluna vê as dúvidas que enviou com sessão iniciada.
create policy "Aluna vê as próprias dúvidas"
  on public.hot_seat_questions for select
  to authenticated
  using (student_id = auth.uid());
