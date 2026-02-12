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

## 4. Cron job
`vercel.json` schedules:
- `*/5 * * * *` -> `/api/cron/inbox-sync`

Cron security checks:
- Vercel cron header (`x-vercel-cron`) in production.
- `CRON_SECRET` via Bearer token / header / query.

If `CRON_SECRET` is set in Vercel, Vercel cron automatically sends:
- `Authorization: Bearer <CRON_SECRET>`

## 5. Post deploy checklist
1. Confirm login behavior matches your `ALLOWED_USER_EMAILS` policy.
2. Send a test campaign to a controlled inbox.
3. Reply to the email from that inbox.
4. Confirm inbound message appears and thread status becomes `REPLIED`.
