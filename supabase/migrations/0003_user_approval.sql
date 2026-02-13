begin;

alter table public.users
  add column if not exists is_admin boolean not null default false,
  add column if not exists is_approved boolean not null default false,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.users (id);

create index if not exists idx_users_is_admin on public.users (is_admin);
create index if not exists idx_users_is_approved on public.users (is_approved);

-- Keep existing accounts working after rollout.
update public.users
set
  is_approved = true,
  approved_at = coalesce(approved_at, created_at)
where is_approved = false;

commit;
