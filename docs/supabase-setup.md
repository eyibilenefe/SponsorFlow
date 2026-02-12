# Supabase Setup

## 1. Create project
1. Create a new Supabase project.
2. Copy `Project URL`, `anon key`, and `service_role key`.

## 2. Run schema migrations
Run the SQL files in order:
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_indexes_rls.sql`

Then run seed data:
3. `supabase/seed.sql`

## 3. Auth configuration
1. Enable Email/Password auth provider.
2. For MVP internal users, disable public signup in dashboard if you want manual control.
3. App-level policy is controlled by `ALLOWED_USER_EMAILS`:
   - `*`, `all`, or empty => all emails allowed
   - comma-separated list => only listed emails allowed

## 4. Notes
- `public.users` is a profile table synced from `auth.users` via trigger.
- `email` fields use `citext` to enforce case-insensitive uniqueness.
- `Total sponsors` metric is based on `companies` count.
