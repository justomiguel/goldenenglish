import { createClient } from "@/lib/supabase/server";

/** Reads `site_settings.inscriptions_enabled` (defaults to true if missing). */
export async function getInscriptionsEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "inscriptions_enabled")
    .maybeSingle();

  if (data?.value === undefined || data.value === null) return true;
  if (typeof data.value === "boolean") return data.value;
  if (
    typeof data.value === "object" &&
    data.value !== null &&
    "enabled" in data.value
  ) {
    return Boolean((data.value as { enabled?: boolean }).enabled);
  }
  return true;
}
