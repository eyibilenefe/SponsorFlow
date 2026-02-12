# SponsorFlow

Cloud-based Sponsor Management System (Mini CRM) for a university club.

## Stack
- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL + Auth)
- Tailwind CSS
- Nodemailer (SMTP outbound)
- imap-simple (IMAP inbound reply sync)
- Vercel cron deployment

## Features (MVP)
- Supabase Auth (email/password) with configurable allowlist (`ALLOWED_USER_EMAILS`).
- Sponsor companies, contacts, tags, and status tracking.
- Filtered sponsor list (tag, status, owner, search).
- Sponsor detail timeline (inbound/outbound messages).
- Gelen Kutusu sayfasi ile gelen mesajlari merkezi listeleme.
- Bulk campaigns via SMTP (Nodemailer).
- Reply tracking via IMAP sync every 5 minutes (`WAITING`/`SENT` threads).
- Idempotent inbound sync using unique `gmail_message_id` (legacy column name).

## Important behavior
- `Total sponsors` = `companies` count.
- `email` and `tags.name` are case-insensitive unique with `citext`.
- `public.users` is auto-created from `auth.users` trigger.
- Middleware validates allowlist policy on every request; unauthorized users are signed out.

## Quick Start
1. Copy `.env.example` to `.env.local` and fill values.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run Supabase migrations (`supabase/migrations/*.sql`) then `supabase/seed.sql`.
4. Start dev server:
   ```bash
   pnpm dev
   ```

## Project Structure
```txt
src/
  app/
    (auth)/login
    (app)/dashboard
    (app)/sponsors
    (app)/campaigns/new
    (app)/inbox
    (app)/settings/integrations
    api/cron/inbox-sync
  features/
    auth/
    sponsors/
    campaigns/
    gmail/  # provider-agnostic mail layer (legacy folder name)
  lib/
    supabase/
  components/
  types/
supabase/
  migrations/
  seed.sql
docs/
```

## Docs
- `docs/supabase-setup.md`
- `docs/email-setup.md`
- `docs/deployment-vercel.md`
