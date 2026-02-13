# Supabase Setup

## 1. Create project
1. Create a new Supabase project.
2. Copy `Project URL`, `anon key`, and `service_role key`.

## 2. Run schema migrations
Run the SQL files in order:
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_indexes_rls.sql`
3. `supabase/migrations/0003_user_approval.sql`
4. `supabase/migrations/0004_users_update_permissions.sql`

Then run seed data:
5. `supabase/seed.sql`

## 3. Auth configuration
1. Enable Email/Password auth provider.
2. For MVP internal users, disable public signup in dashboard if you want manual control.
3. App-level email policy is controlled by `ALLOWED_USER_EMAILS`:
   - `*`, `all`, or empty => all emails allowed
   - comma-separated list => only listed emails allowed
4. New signup flow:
   - New users are created with `public.users.is_approved = false`.
   - Login is blocked until an admin approves from database.
   - Existing users are auto-approved once during migration `0003`.

## 4. Admin approval from database
Approve a user:

```sql
update public.users
set
  is_approved = true,
  approved_at = timezone('utc', now()),
  approved_by = '<ADMIN_USER_UUID>'
where email = 'new-user@example.com';
```

Optionally mark platform admins:

```sql
update public.users
set is_admin = true
where email = 'admin@example.com';
```

## 5. Notes
- `public.users` is a profile table synced from `auth.users` via trigger.
- `email` fields use `citext` to enforce case-insensitive uniqueness.
- `Total sponsors` metric is based on `companies` count.
- `authenticated` users cannot update `is_admin` / `is_approved` columns themselves.
