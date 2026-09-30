-- Extra write policies so CycloneOS can log advisories and dispatches
-- from the anon key. Run in the Supabase SQL editor after the schema.

alter table advisories enable row level security;
alter table dispatch_log enable row level security;

drop policy if exists "public read advisories" on advisories;
create policy "public read advisories" on advisories for select using (true);

drop policy if exists "public insert advisories" on advisories;
create policy "public insert advisories" on advisories for insert with check (true);

drop policy if exists "public read dispatch" on dispatch_log;
create policy "public read dispatch" on dispatch_log for select using (true);

drop policy if exists "public insert dispatch" on dispatch_log;
create policy "public insert dispatch" on dispatch_log for insert with check (true);
