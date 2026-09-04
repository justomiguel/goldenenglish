import "server-only";
import { createClient } from "@/lib/supabase/server";
import { parseMerchEnabled } from "@/lib/shop/parseMerchEnabled";

export async function loadMerchEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "merch_enabled")
    .maybeSingle();
  return parseMerchEnabled(data?.value);
}
