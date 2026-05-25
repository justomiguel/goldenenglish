import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/types/i18n";
import { locales, defaultLocale } from "@/lib/i18n/dictionaries";

/**
 * Best-effort locale resolution for a user via Supabase Auth metadata.
 * Checks `raw_user_meta_data.locale` (set during signup or profile update).
 * Falls back to `defaultLocale` when no valid locale is found.
 */
export async function resolveUserLocale(
  admin: SupabaseClient,
  userId: string,
): Promise<Locale> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const meta = data?.user?.user_metadata;
    if (meta && typeof meta.locale === "string") {
      const candidate = meta.locale.toLowerCase().slice(0, 2);
      if ((locales as readonly string[]).includes(candidate)) {
        return candidate as Locale;
      }
    }
  } catch {
    /* non-critical — fall back */
  }
  return defaultLocale as Locale;
}
