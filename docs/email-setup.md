# Email Setup (Nodemailer + IMAP)

## 1. Outbound SMTP (Nodemailer)
Set SMTP variables in `.env.local`:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`

Typical secure SMTP values:
- `SMTP_PORT=465`
- `SMTP_SECURE=true`

## 2. Inbound IMAP (imap-simple)
Set IMAP variables in `.env.local`:
- `IMAP_HOST`
- `IMAP_PORT`
- `IMAP_TLS`
- Optional: `IMAP_TLS_REJECT_UNAUTHORIZED` (default `true`)
- `IMAP_USER`
- `IMAP_PASS`
- Optional: `IMAP_MAILBOX` (default `INBOX`)
- Optional: `IMAP_LOOKBACK_HOURS` (default `168`)

Typical secure IMAP values:
- `IMAP_PORT=993`
- `IMAP_TLS=true`
- `IMAP_TLS_REJECT_UNAUTHORIZED=true`

If your provider uses a self-signed certificate:
- set `IMAP_TLS_REJECT_UNAUTHORIZED=false`
- use this only on trusted/private mail servers

## 3. How reply matching works
- System loads `WAITING` and `SENT` threads.
- IMAP messages are parsed.
- Message is matched to a thread by `In-Reply-To` / `References`.
- Deduplication uses `messages.gmail_message_id` unique key.
- On new inbound message:
  - message row inserted as `INBOUND`
  - thread status updated to `REPLIED`
  - `last_activity_at` updated

## 4. Manual sync
Go to **Settings > Integrations** and run **Run Inbox Sync Now**.
