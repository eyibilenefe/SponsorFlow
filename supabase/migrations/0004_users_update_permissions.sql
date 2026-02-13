begin;

revoke update (is_admin, is_approved, approved_at, approved_by)
on public.users
from anon, authenticated;

grant update (name, email)
on public.users
to authenticated;

commit;
