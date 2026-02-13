# SponsorFlow

SponsorFlow is a lightweight CRM built for university clubs that orchestrates sponsor data, threaded outreach, and reply tracking inside a single Next.js + Supabase application.

## Key capabilities
- **Controlled onboarding:** Supabase auth with allowlist + admin approval (`public.users.is_approved`) before a session is issued.
- **Sponsor lifecycle:** Manage companies, contacts, tags, and threaded conversations (inbound/outbound) from one dashboard.
- **Bulk campaigns:** Nodemailer-driven SMTP campaigns with delivery headers and DKIM support, plus inbound syncing via IMAP.
- **Reply tracking:** Threads, messages, and stats update automatically when replies arrive.
- **Operational telemetry:** Metrics on waiting replies, won/lost threads, and total sponsors to help prioritize outreach.

## Technology stack
- Next.js 14 (App Router)
- TypeScript, Tailwind CSS
- Supabase (PostgreSQL, Auth, RLS)
- Nodemailer (SMTP) + imap-simple (IMAP sync)
- Vercel cron jobs (inbox sync)

## Architecture overview
- **App layers:** `src/app` houses the authenticated UI, `(auth)` routes handle login/signup, and API routes cover cron jobs.
- **Domain logic:** `features/` encapsulates auth rules, sponsor management, campaign workflows, and Gmail syncing.
- **Lib utilities:** `lib/supabase` wraps Supabase helpers; `env.ts` centralizes configuration validation.
- **Data model:** Supabase migrations under `supabase/migrations/` build users, companies, contacts, threads, messages, and campaigns tables with citext/enum helpers plus triggers.

## Quick setup
1. Create a Supabase project and copy the project URL + keys.
2. Copy `.env.example` → `.env.local` and fill in Supabase + SMTP/IMAP credentials.
3. Install dependencies: `pnpm install`.
4. Apply migrations + seed: `supabase migrations run` followed by `supabase db seed`.
5. Run locally: `pnpm dev`.

## Environment variables
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `APP_BASE_URL`.
- **Access control:** `ALLOWED_USER_EMAILS` (comma list, `*` for all).
- **SMTP:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, optional `SMTP_FROM_NAME`, `SMTP_REPLY_TO`, `SMTP_LIST_UNSUBSCRIBE_EMAIL`, `SMTP_LIST_UNSUBSCRIBE_URL`, `SMTP_DKIM_DOMAIN_NAME`, `SMTP_DKIM_KEY_SELECTOR`, `SMTP_DKIM_PRIVATE_KEY`.
- **IMAP:** `IMAP_HOST`, `IMAP_PORT`, `IMAP_TLS`, `IMAP_USER`, `IMAP_PASS`, optional `IMAP_TLS_REJECT_UNAUTHORIZED`, `IMAP_MAILBOX`, `IMAP_LOOKBACK_HOURS`.

## Operational notes
- Approve users manually via `public.users` (set `is_approved = true`, record `approved_at`, `approved_by`).
- DKIM requires publishing the selector TXT record that matches `SMTP_DKIM_DOMAIN_NAME` + `SMTP_DKIM_KEY_SELECTOR`.
- Cron job `vercel.json` schedules `/api/cron/inbox-sync` once per day; manual sync exists in Settings → Integrations.
- Campaign reply matching uses `In-Reply-To`/`References` headers and deduplicates by `gmail_message_id`.

## Testing & linting
- `pnpm lint` runs Next.js ESLint.
- Type safety relies on `tsconfig` + Supabase-generated types (watch for the existing `never`-typed inserts in `@supabase/postgrest`).

## Documentation
- `docs/supabase-setup.md` – migrations, approval flow, and policies.
- `docs/email-setup.md` – SMTP/IMAP configuration plus deliverability checklist.
- `docs/deployment-vercel.md` – Vercel onboarding, env vars, and cron job guidance.
