import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import {
  ANALYTICS_CONFIG_DEFAULTS,
  parseAnalyticsConfig,
  type AnalyticsConfigValues,
} from "@/lib/analytics/parseAnalyticsConfig";

const KEY = "analytics_config";

function tsDefaults(): AnalyticsConfigValues {
  return {
    namespace:
      SYSTEM_PROPERTIES_DEFAULTS["analytics.event.namespace"] ??
      ANALYTICS_CONFIG_DEFAULTS.namespace,
    version:
      SYSTEM_PROPERTIES_DEFAULTS["analytics.event.version"] ??
      ANALYTICS_CONFIG_DEFAULTS.version,
    timezone:
      SYSTEM_PROPERTIES_DEFAULTS["analytics.timezone"] ??
      ANALYTICS_CONFIG_DEFAULTS.timezone,
  };
}

export const loadAnalyticsConfig = cache(
  async (): Promise<AnalyticsConfigValues> => {
    const defaults = tsDefaults();
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      return parseAnalyticsConfig(data?.value, defaults);
    } catch {
      return defaults;
    }
  },
);
