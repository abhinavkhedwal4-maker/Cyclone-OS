-- CycloneOS domain schema.
-- Run this once in the Supabase SQL editor, BEFORE policies.sql, on a fresh
-- project. It creates every table src/lib/cyclone/feed.ts queries; without
-- it feed.ts silently falls back to the bundled demo data forever.
--
-- Read/write model:
--   regions / storms / zones / infrastructure / telemetry_readings
--     -> written by GEE + forecast ingestion (service role, see
--        scripts/gee-ingest.mjs), read by anyone with the anon key.
--   advisories / dispatch_log
--     -> written directly from the browser by the Advisory console
--        (anon key), so they additionally get an insert policy in
--        policies.sql.

create table if not exists regions (
  id text primary key,
  name text not null,
  country text not null,
  basin text not null,
  center_lat double precision not null,
  center_lon double precision not null,
  shelf_factor double precision not null default 1
);

create table if not exists storms (
  id uuid primary key default gen_random_uuid(),
  region_id text not null references regions(id) on delete cascade,
  name text not null,
  wind_kmh double precision not null,
  pressure_hpa double precision not null,
  rainfall_mm double precision not null,
  movement_kmh double precision not null,
  heading_deg double precision not null,
  confidence double precision not null default 0.8,
  eta_hours double precision not null,
  recorded_at timestamptz not null default now()
);
create index if not exists storms_region_recorded_idx on storms (region_id, recorded_at desc);

create table if not exists zones (
  id uuid primary key default gen_random_uuid(),
  region_id text not null references regions(id) on delete cascade,
  name text not null,
  distance_km double precision not null,
  elevation_m double precision not null,
  drainage_capacity double precision not null default 0.5,
  population integer not null default 0
);
create index if not exists zones_region_idx on zones (region_id);

create table if not exists infrastructure (
  id uuid primary key default gen_random_uuid(),
  region_id text not null references regions(id) on delete cascade,
  zone_id uuid references zones(id) on delete set null,
  name text not null,
  type text not null check (type in ('power', 'road', 'medical')),
  criticality double precision not null default 0.5
);
create index if not exists infrastructure_region_idx on infrastructure (region_id);

create table if not exists telemetry_readings (
  id bigint generated always as identity primary key,
  region_id text not null references regions(id) on delete cascade,
  reading_type text not null,
  value double precision not null,
  unit text not null default '',
  source text not null default '',
  recorded_at timestamptz not null default now()
);
create index if not exists telemetry_region_recorded_idx on telemetry_readings (region_id, recorded_at desc);

create table if not exists advisories (
  id uuid primary key default gen_random_uuid(),
  region_id text not null references regions(id) on delete cascade,
  headline text not null,
  summary text not null,
  actions jsonb not null default '[]',
  severity text not null check (severity in ('WATCH', 'WARNING', 'EMERGENCY')),
  confidence double precision not null default 0.8,
  source text not null default 'template',
  created_at timestamptz not null default now()
);
create index if not exists advisories_region_created_idx on advisories (region_id, created_at desc);

create table if not exists dispatch_log (
  id uuid primary key default gen_random_uuid(),
  region_id text not null references regions(id) on delete cascade,
  advisory_id uuid references advisories(id) on delete set null,
  dispatched_at timestamptz not null default now()
);
create index if not exists dispatch_region_idx on dispatch_log (region_id, dispatched_at desc);

-- Public read on every table: the dashboard is an anon-key client.
alter table regions enable row level security;
alter table storms enable row level security;
alter table zones enable row level security;
alter table infrastructure enable row level security;
alter table telemetry_readings enable row level security;

drop policy if exists "public read regions" on regions;
create policy "public read regions" on regions for select using (true);

drop policy if exists "public read storms" on storms;
create policy "public read storms" on storms for select using (true);

drop policy if exists "public read zones" on zones;
create policy "public read zones" on zones for select using (true);

drop policy if exists "public read infrastructure" on infrastructure;
create policy "public read infrastructure" on infrastructure for select using (true);

drop policy if exists "public read telemetry" on telemetry_readings;
create policy "public read telemetry" on telemetry_readings for select using (true);

-- No insert/update policy on these five: intentional. They're written by
-- scripts/gee-ingest.mjs using the service-role key, which bypasses RLS.
-- That keeps satellite/forecast writes out of the browser entirely.
-- advisories and dispatch_log keep their public-insert policies in
-- policies.sql, since the Advisory console writes those from the client.

-- Seed one region so the app has somewhere to attach storms/zones/telemetry to.
-- Edit or add more rows for other coastal cities (see gee/bay_of_bengal_export.js CITIES).
insert into regions (id, name, country, basin, center_lat, center_lon, shelf_factor)
values ('kakinada-in', 'Kakinada', 'India', 'Bay of Bengal', 16.99, 82.24, 1.0)
on conflict (id) do nothing;
