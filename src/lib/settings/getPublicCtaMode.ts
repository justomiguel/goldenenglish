import { createClient } from "@/lib/supabase/server";
import { parsePublicCtaMode, type PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

/** Reads `site_settings.public_cta_mode` (defaults to reserve if missing). */
export async function getPublicCtaMode(): Promise<PublicCtaMode> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "public_cta_mode")
    .maybeSingle();
  return parsePublicCtaMode(data?.value);
}
