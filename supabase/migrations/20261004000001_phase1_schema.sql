-- Institutional Store Management System - Phase 1 Schema
-- Production PostgreSQL + Supabase RLS Migration

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null unique,
    role text not null check (role in ('ADMIN', 'STOREKEEPER', 'STAFF', 'STUDENT')) default 'STAFF',
    avatar_url text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Categories Table
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    icon text default 'box',
    color text default '#17352F',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. Items Table (Inventory Master)
create table if not exists public.items (
    id uuid primary key default gen_random_uuid(),
    item_code text not null unique,
    name text not null,
    category_id uuid not null references public.categories(id) on delete restrict,
    description text,
    tracking_type text not null check (tracking_type in ('ASSET', 'STOCK')),
    unit text not null default 'piece' check (unit in ('piece', 'set', 'pair', 'box', 'bottle', 'litre', 'kg', 'pack')),
    total_quantity integer not null default 0 check (total_quantity >= 0),
    minimum_quantity integer not null default 0 check (minimum_quantity >= 0),
    location text not null default 'Main Store',
    condition text not null check (condition in ('GOOD', 'FAIR', 'DAMAGED', 'MAINTENANCE', 'RETIRED')) default 'GOOD',
    image_url text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. People Table (Borrower Registry foundation)
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

-- 5. Institution Settings Table
create table if not exists public.institution_settings (
    id uuid primary key default gen_random_uuid(),
    institution_name text not null default 'Institutional Central Store',
    logo_url text,
    address text default '123 Academic Campus Way, Central Stores Building',
    phone text default '+1 (555) 019-2834',
    email text default 'storekeeper@institution.edu',
    updated_at timestamptz not null default now()
);

-- Indices for operational query speed
create index if not exists idx_items_category on public.items(category_id);
create index if not exists idx_items_code on public.items(item_code);
create index if not exists idx_items_status on public.items(is_active, tracking_type, condition);
create index if not exists idx_people_admission on public.people(admission_number);
create index if not exists idx_people_name on public.people(full_name);
create index if not exists idx_people_role on public.people(role);

-- Helper function to get current user role
create or replace function public.current_user_role()
returns text as $$
declare
    user_role text;
begin
    select role into user_role from public.profiles where id = auth.uid();
    return coalesce(user_role, 'STUDENT');
end;
$$ language plpgsql security definer;

-- Trigger to auto-update updated_at timestamp
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_timestamp_profiles before update on public.profiles
for each row execute procedure public.trigger_set_timestamp();

create trigger set_timestamp_categories before update on public.categories
for each row execute procedure public.trigger_set_timestamp();

create trigger set_timestamp_items before update on public.items
for each row execute procedure public.trigger_set_timestamp();

create trigger set_timestamp_people before update on public.people
for each row execute procedure public.trigger_set_timestamp();

create trigger set_timestamp_settings before update on public.institution_settings
for each row execute procedure public.trigger_set_timestamp();

-- Trigger to create profile when auth.users is created
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

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.people enable row level security;
alter table public.institution_settings enable row level security;

-- PROFILES Policies
create policy "Authenticated users can view active profiles"
    on public.profiles for select
    to authenticated
    using (true);

create policy "Users can update their own profile"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Admins have full access to profiles"
    on public.profiles for all
    to authenticated
    using (public.current_user_role() = 'ADMIN');

-- CATEGORIES Policies
create policy "Authenticated users can view categories"
    on public.categories for select
    to authenticated
    using (true);

create policy "Admins and Storekeepers can create categories"
    on public.categories for insert
    to authenticated
    with check (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

create policy "Admins and Storekeepers can update categories"
    on public.categories for update
    to authenticated
    using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'))
    with check (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

-- ITEMS Policies
create policy "Authenticated users can view items"
    on public.items for select
    to authenticated
    using (true);

create policy "Admins and Storekeepers can insert items"
    on public.items for insert
    to authenticated
    with check (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

create policy "Admins and Storekeepers can update items"
    on public.items for update
    to authenticated
    using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'))
    with check (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

-- PEOPLE Policies
create policy "Authenticated users can view people registry"
    on public.people for select
    to authenticated
    using (true);

create policy "Admins and Storekeepers can insert people"
    on public.people for insert
    to authenticated
    with check (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

create policy "Admins and Storekeepers can update people"
    on public.people for update
    to authenticated
    using (public.current_user_role() in ('ADMIN', 'STOREKEEPER'))
    with check (public.current_user_role() in ('ADMIN', 'STOREKEEPER'));

-- SETTINGS Policies
create policy "Authenticated users can view settings"
    on public.institution_settings for select
    to authenticated
    using (true);

create policy "Admins can update institution settings"
    on public.institution_settings for update
    to authenticated
    using (public.current_user_role() = 'ADMIN')
    with check (public.current_user_role() = 'ADMIN');
