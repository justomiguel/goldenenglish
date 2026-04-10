/**
 * Supabase URL + publishable (anon) key from env.
 * Supports common naming variants from Supabase / Vercel templates.
 */
export function readSupabasePublicEnv(): { url: string; anonKey: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY?.trim() ||
    "";

  return { url, anonKey };
}

export function hasSupabasePublicEnv(): boolean {
  const { url, anonKey } = readSupabasePublicEnv();
  return url.length > 0 && anonKey.length > 0;
}
