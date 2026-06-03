-- Beta-AI Supabase schema, RLS policies, and storage setup.
-- Run this in the Supabase SQL Editor or with psql against your project.

create extension if not exists "pgcrypto";

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    email varchar(255) not null unique,
    full_name varchar(255),
    hashed_password varchar(255) not null,
    created_at timestamptz not null default now()
);

create table if not exists public.analyses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    title varchar(255) not null,
    ai_score double precision,
    plagiarism_score double precision,
    summary text,
    metadata text,
    created_at timestamptz not null default now()
);

create table if not exists public.uploaded_files (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    file_name varchar(255) not null,
    file_type varchar(128) not null,
    file_url varchar(1024) not null,
    uploaded_at timestamptz not null default now()
);

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_analyses_user_created_at on public.analyses(user_id, created_at desc);
create index if not exists idx_uploaded_files_user_uploaded_at on public.uploaded_files(user_id, uploaded_at desc);

alter table public.users enable row level security;
alter table public.analyses enable row level security;
alter table public.uploaded_files enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.users;
create policy "Users can delete own profile"
on public.users for delete
using (auth.uid() = id);

drop policy if exists "Users can read own analyses" on public.analyses;
create policy "Users can read own analyses"
on public.analyses for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own analyses" on public.analyses;
create policy "Users can insert own analyses"
on public.analyses for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own analyses" on public.analyses;
create policy "Users can delete own analyses"
on public.analyses for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own uploaded files" on public.uploaded_files;
create policy "Users can read own uploaded files"
on public.uploaded_files for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own uploaded files" on public.uploaded_files;
create policy "Users can insert own uploaded files"
on public.uploaded_files for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own uploaded files" on public.uploaded_files;
create policy "Users can delete own uploaded files"
on public.uploaded_files for delete
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'beta-ai-files',
    'beta-ai-files',
    false,
    52428800,
    array[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own files" on storage.objects;
create policy "Users can upload own files"
on storage.objects for insert
with check (
    bucket_id = 'beta-ai-files'
    and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can read own stored files" on storage.objects;
create policy "Users can read own stored files"
on storage.objects for select
using (
    bucket_id = 'beta-ai-files'
    and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own stored files" on storage.objects;
create policy "Users can delete own stored files"
on storage.objects for delete
using (
    bucket_id = 'beta-ai-files'
    and auth.uid()::text = (storage.foldername(name))[1]
);
