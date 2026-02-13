# Vercel Deployment

## 1. Push repository
Push this project to GitHub/GitLab/Bitbucket.

## 2. Import to Vercel
1. Import project.
2. Framework preset: Next.js.
3. Build command: `pnpm build`.
4. Install command: `pnpm install`.

## 3. Environment variables
Set all values from `.env.example` in Vercel project settings.

Important:
- `APP_BASE_URL` must match your deployed domain.
- SMTP + IMAP credentials must be valid for the same mailbox.
- `CRON_SECRET` should be long and random.
- If using app-level DKIM, set all `SMTP_DKIM_*` vars and add matching DNS key.

## 4. Cron job
`vercel.json` schedules:
- `0 9 * * *` -> `/api/cron/inbox-sync` (Hobby-compatible: gunde 1 kez)

Not:
- Vercel Hobby planda gunde birden fazla cron calistirilamaz.
- Daha sik senkron gerekiyorsa:
  - Vercel Pro'ya gecin, veya
  - Uygulamadaki manuel senkron butonunu kullanin.

Cron security checks:
- Vercel cron header (`x-vercel-cron`) in production.
- `CRON_SECRET` via Bearer token / header / query.

If `CRON_SECRET` is set in Vercel, Vercel cron automatically sends:
- `Authorization: Bearer <CRON_SECRET>`

## 5. Post deploy checklist
1. Confirm login behavior matches `ALLOWED_USER_EMAILS` policy.
2. Create a new test account and verify login is blocked before DB approval.
3. Approve the user in `public.users` (`is_approved=true`) and verify login works.
4. Send a test campaign to a controlled inbox.
5. Reply to the email from that inbox.
6. Confirm inbound message appears and thread status becomes `REPLIED`.
