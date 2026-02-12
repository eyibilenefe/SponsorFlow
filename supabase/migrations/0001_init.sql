begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  create type public.thread_status as enum (
    'NEW',
    'SENT',
    'WAITING',
    'REPLIED',
    'MEETING',
    'WON',
    'LOST'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_direction as enum ('OUTBOUND', 'INBOUND');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.campaign_send_status as enum ('PENDING', 'SENT', 'FAILED');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email citext not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  full_name text not null,
  email citext not null unique,
  phone text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name citext not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.company_tags (
  company_id uuid not null references public.companies (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (company_id, tag_id)
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  status public.thread_status not null default 'NEW',
  gmail_thread_id text unique,
  last_activity_at timestamptz not null default timezone('utc', now()),
  owner_user_id uuid references public.users (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  direction public.message_direction not null,
  subject text not null default '',
  body text not null default '',
  gmail_message_id text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject_template text not null,
  body_template text not null,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaign_recipients (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  thread_id uuid references public.threads (id),
  send_status public.campaign_send_status not null default 'PENDING',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (campaign_id, contact_id)
);

create or replace function public.normalize_email_value()
returns trigger
language plpgsql
as $$
begin
  if new.email is not null then
    new.email := lower(trim(new.email::text))::citext;
  end if;
  return new;
end;
$$;

create or replace function public.normalize_tag_name()
returns trigger
language plpgsql
as $$
begin
  if new.name is not null then
    new.name := lower(trim(new.name::text))::citext;
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_users_email on public.users;
create trigger normalize_users_email
before insert or update on public.users
for each row execute function public.normalize_email_value();

drop trigger if exists normalize_contacts_email on public.contacts;
create trigger normalize_contacts_email
before insert or update on public.contacts
for each row execute function public.normalize_email_value();

drop trigger if exists normalize_tags_name on public.tags;
create trigger normalize_tags_name
before insert or update on public.tags
for each row execute function public.normalize_tag_name();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    lower(new.email)::citext
  )
  on conflict (id) do update
  set
    name = excluded.name,
    email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create index if not exists idx_companies_name on public.companies (name);
create index if not exists idx_companies_created_by on public.companies (created_by);
create index if not exists idx_companies_created_at on public.companies (created_at desc);

create index if not exists idx_contacts_company_id on public.contacts (company_id);

create index if not exists idx_company_tags_tag_id on public.company_tags (tag_id);

create index if not exists idx_threads_status on public.threads (status);
create index if not exists idx_threads_owner on public.threads (owner_user_id);
create index if not exists idx_threads_last_activity on public.threads (last_activity_at desc);
create index if not exists idx_threads_gmail_thread on public.threads (gmail_thread_id);

create index if not exists idx_messages_thread_created on public.messages (thread_id, created_at desc);

create index if not exists idx_campaign_recipients_campaign on public.campaign_recipients (campaign_id);
create index if not exists idx_campaign_recipients_status on public.campaign_recipients (send_status);
create index if not exists idx_campaign_recipients_contact on public.campaign_recipients (contact_id);

commit;
