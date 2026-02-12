export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getAllowedEmails(): Set<string> {
  const raw = process.env.ALLOWED_USER_EMAILS ?? "";
  const emails = raw
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
  return new Set(emails);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  const raw = (process.env.ALLOWED_USER_EMAILS ?? "").trim().toLowerCase();
  if (!raw || raw === "*" || raw === "all") {
    return true;
  }
  const allowlist = getAllowedEmails();
  if (allowlist.size === 0) {
    return true;
  }
  return allowlist.has(normalizeEmail(email));
}
