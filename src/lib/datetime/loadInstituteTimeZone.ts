import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import {
  INSTITUTE_TIMEZONE_DEFAULT,
  parseInstituteTimeZone,
} from "@/lib/datetime/parseInstituteTimeZone";

const KEY = "analytics_config";

export const loadInstituteTimeZone = cache(async (): Promise<string> => {
  const defaultTz =
    SYSTEM_PROPERTIES_DEFAULTS["analytics.timezone"] ?? INSTITUTE_TIMEZONE_DEFAULT;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", KEY)
      .maybeSingle();
    return parseInstituteTimeZone(data?.value, defaultTz);
  } catch {
    return defaultTz;
  }
});
