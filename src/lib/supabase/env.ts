export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

export function isSupabaseConfigured() {
  if (process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true") return false;
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function isDemoAccessEnabled() {
  return process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true";
}
