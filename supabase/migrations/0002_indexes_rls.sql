begin;

alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.tags enable row level security;
alter table public.company_tags enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;

drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated"
on public.users
for select
to authenticated
using (true);

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "companies_rw_authenticated" on public.companies;
create policy "companies_rw_authenticated"
on public.companies
for all
to authenticated
using (true)
with check (true);

drop policy if exists "contacts_rw_authenticated" on public.contacts;
create policy "contacts_rw_authenticated"
on public.contacts
for all
to authenticated
using (true)
with check (true);

drop policy if exists "tags_rw_authenticated" on public.tags;
create policy "tags_rw_authenticated"
on public.tags
for all
to authenticated
using (true)
with check (true);

drop policy if exists "company_tags_rw_authenticated" on public.company_tags;
create policy "company_tags_rw_authenticated"
on public.company_tags
for all
to authenticated
using (true)
with check (true);

drop policy if exists "threads_rw_authenticated" on public.threads;
create policy "threads_rw_authenticated"
on public.threads
for all
to authenticated
using (true)
with check (true);

drop policy if exists "messages_rw_authenticated" on public.messages;
create policy "messages_rw_authenticated"
on public.messages
for all
to authenticated
using (true)
with check (true);

drop policy if exists "campaigns_rw_authenticated" on public.campaigns;
create policy "campaigns_rw_authenticated"
on public.campaigns
for all
to authenticated
using (true)
with check (true);

drop policy if exists "campaign_recipients_rw_authenticated" on public.campaign_recipients;
create policy "campaign_recipients_rw_authenticated"
on public.campaign_recipients
for all
to authenticated
using (true)
with check (true);

commit;
