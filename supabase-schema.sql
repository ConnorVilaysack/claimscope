-- ClaimScope Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  report_credits integer default 2 not null,
  is_subscriber boolean default false not null,
  subscription_ends_at timestamptz,
  created_at timestamptz default now() not null
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Claims table
create table public.claims (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  address text not null,
  notes text,
  status text default 'draft' not null check (status in ('draft', 'inspecting', 'analyzing', 'report_ready', 'completed')),
  created_at timestamptz default now() not null
);

-- Photos table (no constraint on photo_type — flexible tagging)
create table public.photos (
  id uuid default uuid_generate_v4() primary key,
  claim_id uuid references public.claims(id) on delete cascade not null,
  photo_type text not null default 'general',
  file_url text not null,
  analysis jsonb,
  created_at timestamptz default now() not null
);

-- Reports table
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  claim_id uuid references public.claims(id) on delete cascade not null,
  report_text text not null,
  pdf_url text,
  access_unlocked boolean default false not null,
  created_at timestamptz default now() not null
);

-- Payments table (Stripe tracking)
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  stripe_session_id text unique not null,
  amount_cents integer not null,
  credits integer not null default 1,
  created_at timestamptz default now() not null
);

-- Create storage bucket for photos
insert into storage.buckets (id, name, public)
values ('claim-photos', 'claim-photos', true)
on conflict do nothing;

create policy "Allow all uploads" on storage.objects
  for insert with check (bucket_id = 'claim-photos');

create policy "Allow all reads" on storage.objects
  for select using (bucket_id = 'claim-photos');

create policy "Allow all deletes" on storage.objects
  for delete using (bucket_id = 'claim-photos');

-- RPC to safely decrement report credits
create or replace function public.decrement_credits(uid uuid)
returns void as $$
begin
  update public.users
  set report_credits = greatest(report_credits - 1, 0)
  where id = uid;
end;
$$ language plpgsql security definer;

-- RPC to increment report credits (after payment)
create or replace function public.increment_credits(uid uuid)
returns void as $$
begin
  update public.users
  set report_credits = report_credits + 1
  where id = uid;
end;
$$ language plpgsql security definer;

-- Report templates table
create table public.templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  original_file_url text,
  structure jsonb not null,
  is_default boolean default false not null,
  created_at timestamptz default now() not null
);

-- Create storage bucket for template PDFs
insert into storage.buckets (id, name, public)
values ('report-templates', 'report-templates', true)
on conflict do nothing;

create policy "Allow template uploads" on storage.objects
  for insert with check (bucket_id = 'report-templates');

create policy "Allow template reads" on storage.objects
  for select using (bucket_id = 'report-templates');

create policy "Allow template deletes" on storage.objects
  for delete using (bucket_id = 'report-templates');

-- Migration helper: run these if you already have the tables
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS report_credits integer DEFAULT 2 NOT NULL;
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_subscriber boolean DEFAULT false NOT NULL;
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz;
-- ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_photo_type_check;
-- ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS access_unlocked boolean DEFAULT false NOT NULL;
-- Run the decrement_credits and increment_credits functions above as well.
-- CREATE TABLE IF NOT EXISTS public.templates (id uuid default uuid_generate_v4() primary key, user_id uuid references public.users(id) on delete cascade not null, name text not null, original_file_url text, structure jsonb not null, is_default boolean default false not null, created_at timestamptz default now() not null);
