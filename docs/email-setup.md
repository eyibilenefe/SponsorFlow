# Email Setup (Nodemailer + IMAP)

## 1. Outbound SMTP (Nodemailer)
Set SMTP variables in `.env.local`:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- Optional: `SMTP_FROM_NAME`
- Optional: `SMTP_REPLY_TO`
- Optional: `SMTP_LIST_UNSUBSCRIBE_EMAIL`
- Optional: `SMTP_LIST_UNSUBSCRIBE_URL`
- Optional DKIM: `SMTP_DKIM_DOMAIN_NAME`, `SMTP_DKIM_KEY_SELECTOR`, `SMTP_DKIM_PRIVATE_KEY`

Typical secure SMTP values:
- `SMTP_PORT=465`
- `SMTP_SECURE=true`

If DKIM is used:
- set all 3 DKIM vars together
- put private key with escaped line breaks (`\n`) in env value
- publish matching DNS TXT record for selector + domain

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

## 3. Deliverability / spam checklist
For inbox placement, code-only changes are not enough. Do all items:
1. SPF: include your SMTP sender in domain SPF record.
2. DKIM: enable at provider or via app DKIM vars, then publish DNS key.
3. DMARC: start with `p=none`, then tighten to `quarantine/reject`.
4. Use a verified sender domain (`SMTP_FROM_EMAIL`) that matches SPF/DKIM alignment.
5. Keep complaint/bounce rate low and avoid sending to cold lists.

App behavior added for better deliverability:
- Sets `Reply-To`.
- Adds `List-Unsubscribe` headers when configured.
- Adds `X-Auto-Response-Suppress` to reduce noisy auto-replies.
- Supports DKIM signing via Nodemailer when DKIM env vars are present.

## 4. How reply matching works
- System loads `WAITING` and `SENT` threads.
- IMAP messages are parsed.
- Message is matched to a thread by `In-Reply-To` / `References`.
- Deduplication uses `messages.gmail_message_id` unique key.
- On new inbound message:
  - message row inserted as `INBOUND`
  - thread status updated to `REPLIED`
  - `last_activity_at` updated

## 5. Manual sync
Go to **Settings > Integrations** and run **Run Inbox Sync Now**.
