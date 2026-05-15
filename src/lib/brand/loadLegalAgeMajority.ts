import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import { parseLegalAgeMajority } from "@/lib/brand/parseLegalAgeMajority";

const KEY = "legal_age_majority";

/** Server-only loader. Reads the operational override from `site_settings`
 *  and falls back to the canonical TS default (Golden = 18). Cached per
 *  request via `React.cache`; invalidate with
 *  `SITE_SETTINGS_OPERATIONAL_CACHE_TAG` when the wizard saves new values. */
export const loadLegalAgeMajority = cache(async (): Promise<number> => {
  const fallback = Number.parseInt(
    SYSTEM_PROPERTIES_DEFAULTS["legal.age.majority"] ?? "18",
    10,
  );
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", KEY)
      .maybeSingle();
    return parseLegalAgeMajority(data?.value, fallback);
  } catch {
    return parseLegalAgeMajority(null, fallback);
  }
});
