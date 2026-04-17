import { getDashboardGreetingKey } from "@/lib/datetime/getDashboardGreetingKey";
import { getProperty, loadProperties } from "@/lib/theme/themeParser";
import type { Dictionary } from "@/types/i18n";

export interface DashboardGreetingViewModel {
  greeting: string;
  fullDateLine: string;
  timeZone: string;
}

const FALLBACK_TZ = "UTC";

/**
 * Builds the localized greeting and a long date line in the institute calendar
 * (`analytics.timezone` from `system.properties`). Used by every role hero.
 */
export function buildDashboardGreeting(
  locale: string,
  dict: Dictionary,
  now: Date = new Date(),
): DashboardGreetingViewModel {
  const props = loadProperties();
  const timeZone = getProperty(props, "analytics.timezone", FALLBACK_TZ) || FALLBACK_TZ;
  const key = getDashboardGreetingKey(now, timeZone);
  const greeting = dict.common.greetings[key];
  const fullDateLine = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  return { greeting, fullDateLine, timeZone };
}
