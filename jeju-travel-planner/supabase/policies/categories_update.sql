-- Categories UPDATE policy for anon (RLS)
-- Execute in Supabase SQL Editor (requires owner privileges)
-- Note: If a policy with the same name already exists, drop it first.

alter table if exists public.categories enable row level security;

create policy "categories_update_anon_all"
on public.categories
for update
to anon
using (true)
with check (true);

-- Optionally, ensure INSERT/SELECT exist as needed:
-- create policy "categories_select_anon_all" on public.categories for select to anon using (true);
-- create policy "categories_insert_anon_all" on public.categories for insert to anon with check (true);