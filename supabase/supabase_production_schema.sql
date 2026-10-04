-- =====================================================================
-- INSTITUTIONAL STORE MANAGEMENT SYSTEM - COMPLETE PRODUCTION SUPABASE DDL
-- Database Schema, Tables, Functions, Triggers, RLS Policies & Seed Data
-- =====================================================================

-- 0. Enable extensions
create extension if not exists "uuid-ossp";

-- =====================================================================
-- 1. PROFILES TABLE (Linked to Supabase Auth)
-- =====================================================================
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null unique,
    role text not null check (role in ('ADMIN', 'STOREKEEPER', 'STAFF', 'STUDENT')) default 'STOREKEEPER',
    avatar_url text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 2. CATEGORIES TABLE
-- =====================================================================
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    icon text default 'box',
    color text default '#34495E',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 3. ITEMS TABLE (Inventory Catalog)
-- =====================================================================
create table if not exists public.items (
    id uuid primary key default gen_random_uuid(),
    item_code text not null unique,
    name text not null,
    category_id uuid not null references public.categories(id) on delete restrict,
    description text,
    tracking_type text not null check (tracking_type in ('ASSET', 'STOCK')),
    unit text not null default 'piece' check (unit in ('piece', 'set', 'pair', 'box', 'bottle', 'litre', 'kg', 'pack')),
    unit_price numeric(12, 2) check (unit_price >= 0),
    total_quantity integer not null default 0 check (total_quantity >= 0),
    available_quantity integer not null default 0 check (available_quantity >= 0),
    minimum_quantity integer not null default 0 check (minimum_quantity >= 0),
    location text not null default 'Main Store',
    condition text not null check (condition in ('GOOD', 'FAIR', 'DAMAGED', 'MAINTENANCE', 'RETIRED')) default 'GOOD',
    image_url text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Ensure all columns exist even if public.items was created in an older schema version
alter table public.items add column if not exists item_code text;
alter table public.items add column if not exists tracking_type text check (tracking_type in ('ASSET', 'STOCK')) default 'STOCK';
alter table public.items add column if not exists unit text default 'piece';
alter table public.items add column if not exists unit_price numeric(12, 2) check (unit_price >= 0);
alter table public.items add column if not exists total_quantity integer default 0 check (total_quantity >= 0);
alter table public.items add column if not exists available_quantity integer default 0 check (available_quantity >= 0);
alter table public.items add column if not exists minimum_quantity integer default 0 check (minimum_quantity >= 0);
alter table public.items add column if not exists location text default 'Main Store';
alter table public.items add column if not exists condition text check (condition in ('GOOD', 'FAIR', 'DAMAGED', 'MAINTENANCE', 'RETIRED')) default 'GOOD';
alter table public.items add column if not exists image_url text;
alter table public.items add column if not exists is_active boolean default true;

-- =====================================================================
-- 4. PEOPLE TABLE (Students, Teachers, Staff)
-- =====================================================================
create table if not exists public.people (
    id uuid primary key default gen_random_uuid(),
    admission_number text unique,
    full_name text not null,
    role text not null check (role in ('STUDENT', 'STAFF', 'TEACHER', 'OTHER')),
    department text,
    class_name text,
    phone text,
    email text,
    photo_url text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 5. INSTITUTION SETTINGS TABLE
-- =====================================================================
create table if not exists public.institution_settings (
    id uuid primary key default gen_random_uuid(),
    institution_name text not null default 'Darul Huda Islamic University',
    logo_url text,
    address text default 'Central Campus, Store Division, Building C, Ground Floor',
    phone text default '+91 494 2460575',
    email text default 'storekeeper@dhiu.in',
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 6. ISSUES TABLE & LINE ITEMS (Phase 2 Workflow)
-- =====================================================================
create table if not exists public.issues (
    id uuid primary key default gen_random_uuid(),
    issue_number text not null unique,
    person_id uuid not null references public.people(id) on delete restrict,
    issued_by uuid references public.profiles(id) on delete set null,
    purpose text,
    expected_return_date timestamptz,
    status text not null check (status in ('ACTIVE', 'PARTIALLY_RETURNED', 'RETURNED', 'OVERDUE')) default 'ACTIVE',
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.issue_items (
    id uuid primary key default gen_random_uuid(),
    issue_id uuid not null references public.issues(id) on delete cascade,
    item_id uuid not null references public.items(id) on delete restrict,
    quantity_issued integer not null check (quantity_issued > 0),
    quantity_returned integer not null default 0 check (quantity_returned >= 0),
    created_at timestamptz not null default now()
);

-- =====================================================================
-- 7. RETURNS TABLE & LINE ITEMS (Phase 2 Workflow)
-- =====================================================================
create table if not exists public.returns (
    id uuid primary key default gen_random_uuid(),
    return_number text not null unique,
    issue_id uuid not null references public.issues(id) on delete restrict,
    person_id uuid not null references public.people(id) on delete restrict,
    received_by uuid references public.profiles(id) on delete set null,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.return_items (
    id uuid primary key default gen_random_uuid(),
    return_id uuid not null references public.returns(id) on delete cascade,
    item_id uuid not null references public.items(id) on delete restrict,
    quantity_returned integer not null check (quantity_returned > 0),
    condition text not null check (condition in ('GOOD', 'FAIR', 'DAMAGED', 'NEEDS_REPAIR')),
    notes text,
    created_at timestamptz not null default now()
);

-- =====================================================================
-- 8. STOCK ADJUSTMENTS TABLE (Phase 5 Inventory Safety)
-- =====================================================================
create table if not exists public.stock_adjustments (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references public.items(id) on delete cascade,
    quantity_before integer not null,
    quantity_change integer not null,
    quantity_after integer not null check (quantity_after >= 0),
    reason text not null check (reason in ('NEW_STOCK_RECEIVED', 'PHYSICAL_COUNT_CORRECTION', 'DAMAGED', 'LOST', 'OTHER')),
    notes text,
    performed_by text not null default 'Storekeeper',
    created_at timestamptz not null default now()
);

-- =====================================================================
-- 9. AUDIT LOGS TABLE (Phase 5 Immutable Trail)
-- =====================================================================
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    action_type text not null,
    details text not null,
    entity_ref text,
    performed_by text not null default 'Storekeeper',
    created_at timestamptz not null default now()
);

-- =====================================================================
-- 10. INDEXES FOR HIGH-SPEED QUERYING
-- =====================================================================
create index if not exists idx_items_category on public.items(category_id);
create index if not exists idx_items_code on public.items(item_code);
create index if not exists idx_items_status on public.items(is_active, tracking_type, condition);
create index if not exists idx_people_admission on public.people(admission_number);
create index if not exists idx_people_name on public.people(full_name);
create index if not exists idx_issues_person on public.issues(person_id);
create index if not exists idx_issues_status on public.issues(status);
create index if not exists idx_returns_issue on public.returns(issue_id);
create index if not exists idx_stock_adj_item on public.stock_adjustments(item_id);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- =====================================================================
-- 11. DATABASE FUNCTIONS & TRIGGERS
-- =====================================================================
create or replace function public.current_user_role()
returns text as $$
declare
    user_role text;
begin
    select role into user_role from public.profiles where id = auth.uid();
    return coalesce(user_role, 'STOREKEEPER');
end;
$$ language plpgsql security definer;

create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Triggers (Dropped first for idempotency)
drop trigger if exists set_timestamp_profiles on public.profiles;
drop trigger if exists set_timestamp_categories on public.categories;
drop trigger if exists set_timestamp_items on public.items;
drop trigger if exists set_timestamp_people on public.people;
drop trigger if exists set_timestamp_settings on public.institution_settings;
drop trigger if exists set_timestamp_issues on public.issues;
drop trigger if exists set_timestamp_returns on public.returns;

create trigger set_timestamp_profiles before update on public.profiles for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_categories before update on public.categories for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_items before update on public.items for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_people before update on public.people for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_settings before update on public.institution_settings for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_issues before update on public.issues for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_returns before update on public.returns for each row execute procedure public.trigger_set_timestamp();

-- Automatic auth user signup handler
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name, email, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'STOREKEEPER')
    )
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- =====================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.people enable row level security;
alter table public.institution_settings enable row level security;
alter table public.issues enable row level security;
alter table public.issue_items enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;
alter table public.stock_adjustments enable row level security;
alter table public.audit_logs enable row level security;

-- Drop policies if exists for clean idempotency
drop policy if exists "Authenticated select profiles" on public.profiles;
drop policy if exists "Update own profile" on public.profiles;
drop policy if exists "Authenticated select categories" on public.categories;
drop policy if exists "Manage categories" on public.categories;
drop policy if exists "Authenticated select items" on public.items;
drop policy if exists "Manage items" on public.items;
drop policy if exists "Authenticated select people" on public.people;
drop policy if exists "Manage people" on public.people;
drop policy if exists "Authenticated select settings" on public.institution_settings;
drop policy if exists "Manage settings" on public.institution_settings;
drop policy if exists "Authenticated select issues" on public.issues;
drop policy if exists "Manage issues" on public.issues;
drop policy if exists "Authenticated select issue items" on public.issue_items;
drop policy if exists "Manage issue items" on public.issue_items;
drop policy if exists "Authenticated select returns" on public.returns;
drop policy if exists "Manage returns" on public.returns;
drop policy if exists "Authenticated select return items" on public.return_items;
drop policy if exists "Manage return items" on public.return_items;
drop policy if exists "Authenticated select stock adjustments" on public.stock_adjustments;
drop policy if exists "Manage stock adjustments" on public.stock_adjustments;
drop policy if exists "Authenticated select audit logs" on public.audit_logs;
drop policy if exists "Insert audit logs" on public.audit_logs;

-- Universal Authenticated RLS Policies
create policy "Authenticated select profiles" on public.profiles for select to authenticated using (true);
create policy "Update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Authenticated select categories" on public.categories for select to authenticated using (true);
create policy "Manage categories" on public.categories for all to authenticated using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

create policy "Authenticated select items" on public.items for select to authenticated using (true);
create policy "Manage items" on public.items for all to authenticated using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

create policy "Authenticated select people" on public.people for select to authenticated using (true);
create policy "Manage people" on public.people for all to authenticated using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

create policy "Authenticated select settings" on public.institution_settings for select to authenticated using (true);
create policy "Manage settings" on public.institution_settings for all to authenticated using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

create policy "Authenticated select issues" on public.issues for select to authenticated using (true);
create policy "Manage issues" on public.issues for all to authenticated using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));
create policy "Authenticated select issue items" on public.issue_items for select to authenticated using (true);
create policy "Manage issue items" on public.issue_items for all to authenticated using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

create policy "Authenticated select returns" on public.returns for select to authenticated using (true);
create policy "Manage returns" on public.returns for all to authenticated using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));
create policy "Authenticated select return items" on public.return_items for select to authenticated using (true);
create policy "Manage return items" on public.return_items for all to authenticated using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

create policy "Authenticated select stock adjustments" on public.stock_adjustments for select to authenticated using (true);
create policy "Manage stock adjustments" on public.stock_adjustments for insert to authenticated with check (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

create policy "Authenticated select audit logs" on public.audit_logs for select to authenticated using (true);
create policy "Insert audit logs" on public.audit_logs for insert to authenticated with check (true);

-- =====================================================================
-- 13. INITIAL SEED DATA
-- =====================================================================
insert into public.institution_settings (id, institution_name, address, phone, email)
values (
    'a0000000-0000-4000-8000-000000000001',
    'StoreHub',
    'Central Campus, Store Division, Building C, Ground Floor',
    '+91 494 2460575',
    'storekeeper@dhiu.in'
) on conflict (id) do nothing;

insert into public.categories (id, name, description, icon, color, is_active) values
('c1000000-0000-4000-8000-000000000001', 'Sports Equipment', 'Athletics, field gear, indoor and outdoor sports items', 'trophy', '#34495E', true),
('c1000000-0000-4000-8000-000000000002', 'Electronics', 'Audio/visual devices, cables, projectors, screens and displays', 'tv', '#2C3E50', true),
('c1000000-0000-4000-8000-000000000003', 'Tools & Maintenance', 'Power tools, cleaning machinery, workshop hardware and maintenance gear', 'wrench', '#718355', true),
('c1000000-0000-4000-8000-000000000004', 'Laboratory', 'Chemicals, scientific glassware, measurement kits, test tubes and flasks', 'flask-conical', '#C58A32', true),
('c1000000-0000-4000-8000-000000000005', 'Books & Reference', 'Institutional reference manuals, dictionaries, course encyclopedias', 'book-open', '#4B5563', true),
('c1000000-0000-4000-8000-000000000006', 'Other', 'General institutional utility materials and reusable resources', 'box', '#6D756F', true)
on conflict (name) do nothing;

insert into public.items (
    id, item_code, name, category_id, description, tracking_type, unit, unit_price,
    total_quantity, available_quantity, minimum_quantity, location, condition, is_active
) values
('11000000-0000-4000-8000-000000000001', 'SPORT-BAT-001', 'English Willow Cricket Bat', 'c1000000-0000-4000-8000-000000000001', 'Full-size grade 1 willow bat for inter-college tournaments', 'ASSET', 'piece', 3500.00, 6, 6, 2, 'Sports Pavilion - Locker A1', 'GOOD', true),
('11000000-0000-4000-8000-000000000002', 'SPORT-BALL-001', 'FIFA Quality Pro Football (Size 5)', 'c1000000-0000-4000-8000-000000000001', 'Match-grade polyurethane synthetic leather football', 'STOCK', 'piece', 1200.00, 18, 18, 5, 'Sports Store - Bin 4', 'GOOD', true),
('11000000-0000-4000-8000-000000000005', 'ELEC-PRJ-001', 'Epson Full HD Laser Projector (4000 Lumens)', 'c1000000-0000-4000-8000-000000000002', 'Portable classroom & seminar hall projector with HDMI/VGA', 'ASSET', 'piece', 45000.00, 4, 3, 1, 'AV Store - Cabinet 2', 'GOOD', true),
('11000000-0000-4000-8000-000000000007', 'ELEC-MIC-001', 'Shure Dual UHF Wireless Lapel & Handheld Microphone Kit', 'c1000000-0000-4000-8000-000000000002', 'Auditorium wireless mic set with receiver and rechargeable batteries', 'ASSET', 'set', 18500.00, 5, 5, 2, 'AV Store - Case 3', 'GOOD', true)
on conflict (item_code) do nothing;
