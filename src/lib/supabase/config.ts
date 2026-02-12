function requiredPublic(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabasePublicConfig() {
  return {
    url: requiredPublic("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requiredPublic("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  };
}
