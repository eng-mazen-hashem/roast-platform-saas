-- ==============================================================================
-- Supabase Database Master Migration & Seeding Script
-- Paste this script directly into the Supabase SQL Editor to initialize.
-- ==============================================================================

-- 1. Drop existing objects with cascade to clear dependencies cleanly
drop trigger if exists on_profile_changed on public.profiles cascade;
drop trigger if exists on_auth_user_created on auth.users cascade;
drop function if exists public.sync_profile_to_user_metadata() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.get_auth_role() cascade;
drop function if exists public.get_auth_tenant_id() cascade;

drop view if exists public.companies cascade;
drop view if exists public.users cascade;

drop table if exists public.roast_profiles cascade;
drop table if exists public.machines cascade;
drop table if exists public.profiles cascade;
drop table if exists public.tenants cascade;

drop type if exists user_role cascade;

-- 2. Create Custom Types
create type user_role as enum ('super_admin', 'roastery_admin', 'machine_operator');

-- 3. Create Tenants Table (Matches "companies")
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Create Profiles Table (Matches "users", references auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role not null default 'machine_operator',
  tenant_id uuid references public.tenants(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Create SQL Views to support aliases ("companies" and "users")
create or replace view public.companies as select * from public.tenants;
create or replace view public.users as select * from public.profiles;

-- 6. Create Machines Table (IoT devices)
create table public.machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'offline',
  bean_temp numeric not null default 0.0,
  env_temp numeric not null default 0.0,
  power_source text not null default 'main',
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_power_source check (power_source in ('main', 'battery')),
  constraint valid_status check (status in ('online', 'offline'))
);

-- 7. Create Roast Profiles Table (Roast history)
create table public.roast_profiles (
  id uuid primary key default gen_random_uuid(),
  bean_type text not null,
  batch_weight text not null,
  duration text not null,
  peak_temp numeric not null,
  machine_id uuid references public.machines(id) on delete set null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  curve_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Enable Row Level Security (RLS)
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.machines enable row level security;
alter table public.roast_profiles enable row level security;

-- 9. Helper functions to extract metadata from JWT claims to prevent RLS loop evaluation
create or replace function public.get_auth_tenant_id()
returns uuid as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id', '')::uuid;
$$ language sql stable security definer;

create or replace function public.get_auth_role()
returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role', '');
$$ language sql stable security definer;

-- 10. RLS Policies for tenants
create policy "Users can view assigned tenant"
  on public.tenants for select
  using (id = public.get_auth_tenant_id() or public.get_auth_role() = 'super_admin');

create policy "Super admins have full tenant access"
  on public.tenants for all
  using (public.get_auth_role() = 'super_admin');

-- 11. RLS Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.get_auth_role() = 'super_admin');

create policy "Roastery admins can view tenant profiles"
  on public.profiles for select
  using (
    tenant_id = public.get_auth_tenant_id() 
    and public.get_auth_role() = 'roastery_admin'
  );

create policy "Roastery admins can update tenant profiles"
  on public.profiles for update
  using (
    tenant_id = public.get_auth_tenant_id() 
    and public.get_auth_role() = 'roastery_admin'
  );

create policy "Super admins full profile access"
  on public.profiles for all
  using (public.get_auth_role() = 'super_admin');

-- 12. RLS Policies for machines
create policy "Tenant members can view machines"
  on public.machines for select
  using (tenant_id = public.get_auth_tenant_id() or public.get_auth_role() = 'super_admin');

create policy "Roastery admins can manage machines"
  on public.machines for all
  using (
    tenant_id = public.get_auth_tenant_id() 
    and public.get_auth_role() = 'roastery_admin'
  )
  with check (
    tenant_id = public.get_auth_tenant_id() 
    and public.get_auth_role() = 'roastery_admin'
  );

create policy "Super admins full machine access"
  on public.machines for all
  using (public.get_auth_role() = 'super_admin');

-- 13. RLS Policies for roast_profiles
create policy "Tenant members can view roast profiles"
  on public.roast_profiles for select
  using (tenant_id = public.get_auth_tenant_id() or public.get_auth_role() = 'super_admin');

create policy "Roastery admins can manage roast profiles"
  on public.roast_profiles for all
  using (
    tenant_id = public.get_auth_tenant_id() 
    and public.get_auth_role() = 'roastery_admin'
  )
  with check (
    tenant_id = public.get_auth_tenant_id() 
    and public.get_auth_role() = 'roastery_admin'
  );

create policy "Super admins full roast profiles access"
  on public.roast_profiles for all
  using (public.get_auth_role() = 'super_admin');

-- 14. Auth signup trigger: Provision public.profiles on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'machine_operator');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 15. Profile metadata sync trigger: Sync local profile role/tenant to session JWT claims
create or replace function public.sync_profile_to_user_metadata()
returns trigger as $$
begin
  update auth.users
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', new.role, 'tenant_id', new.tenant_id)
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_changed
  after insert or update of role, tenant_id on public.profiles
  for each row execute procedure public.sync_profile_to_user_metadata();

-- 16. Enable realtime replication for machines updates
alter publication supabase_realtime add table public.machines;

-- 17. Create Performance Indexes
create index idx_profiles_tenant_id on public.profiles(tenant_id);
create index idx_machines_tenant_id on public.machines(tenant_id);
create index idx_roast_profiles_tenant_id on public.roast_profiles(tenant_id);
create index idx_roast_profiles_machine_id on public.roast_profiles(machine_id);
create index idx_roast_profiles_created_at on public.roast_profiles(created_at desc);

-- ==============================================================================
-- 18. INSERT SEED DATA
-- Use these exact static UUIDs in your ESP32 config.h file for testing.
-- ==============================================================================

-- Seed a Mock Company (Tenant)
insert into public.tenants (id, name, slug)
values (
  'd1a90c5f-36a5-48b4-82a1-e0c1f1f2bb8b',
  'Elite Roasters Ltd',
  'elite-roasters'
);

-- Seed a Mock Machine assigned to that Company
insert into public.machines (id, name, status, bean_temp, env_temp, power_source, tenant_id)
values (
  'e1a90c5f-36a5-48b4-82a1-e0c1f1f2bb8b',
  'Industrial Roaster A-100',
  'offline',
  0.0,
  0.0,
  'main',
  'd1a90c5f-36a5-48b4-82a1-e0c1f1f2bb8b'
);
