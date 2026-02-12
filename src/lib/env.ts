import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredNumber(name: string): number {
  const value = Number(required(name));
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return value;
}

function requiredBoolean(name: string): boolean {
  const value = required(name).trim().toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new Error(`Environment variable ${name} must be true/false or 1/0`);
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function optionalBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = raw.trim().toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get SMTP_HOST() {
    return required("SMTP_HOST");
  },
  get SMTP_PORT() {
    return requiredNumber("SMTP_PORT");
  },
  get SMTP_SECURE() {
    return requiredBoolean("SMTP_SECURE");
  },
  get SMTP_USER() {
    return required("SMTP_USER");
  },
  get SMTP_PASS() {
    return required("SMTP_PASS");
  },
  get SMTP_FROM_EMAIL() {
    return required("SMTP_FROM_EMAIL");
  },
  get IMAP_HOST() {
    return required("IMAP_HOST");
  },
  get IMAP_PORT() {
    return requiredNumber("IMAP_PORT");
  },
  get IMAP_TLS() {
    return requiredBoolean("IMAP_TLS");
  },
  get IMAP_TLS_REJECT_UNAUTHORIZED() {
    return optionalBoolean("IMAP_TLS_REJECT_UNAUTHORIZED", true);
  },
  get IMAP_USER() {
    return required("IMAP_USER");
  },
  get IMAP_PASS() {
    return required("IMAP_PASS");
  },
  get IMAP_MAILBOX() {
    return process.env.IMAP_MAILBOX || "INBOX";
  },
  get IMAP_LOOKBACK_HOURS() {
    return optionalNumber("IMAP_LOOKBACK_HOURS", 168);
  },
  get CRON_SECRET() {
    return required("CRON_SECRET");
  },
  get APP_BASE_URL() {
    return required("APP_BASE_URL");
  }
};
