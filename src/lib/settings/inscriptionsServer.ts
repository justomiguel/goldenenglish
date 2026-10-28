import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RegistrationCohortOption = {
  id: string;
  name: string;
  isCurrent: boolean;
};

export type RegistrationCohortConfig = {
  cohorts: RegistrationCohortOption[];
  currentCohort: RegistrationCohortOption | null;
  activeCohort: RegistrationCohortOption | null;
  configuredCohortId: string | null;
};

export function parseConfiguredCohortId(rawValue: unknown): string | null {
  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    return UUID_RE.test(trimmed) ? trimmed : null;
  }
  if (
    typeof rawValue === "object" &&
    rawValue !== null &&
    "cohortId" in rawValue &&
    typeof (rawValue as { cohortId?: unknown }).cohortId === "string"
  ) {
    const trimmed = ((rawValue as { cohortId: string }).cohortId ?? "").trim();
    return UUID_RE.test(trimmed) ? trimmed : null;
  }
  return null;
}

export function resolveRegistrationCohortState(
  cohorts: RegistrationCohortOption[],
  rawValue: unknown,
): RegistrationCohortConfig {
  const currentCohort = cohorts.find((cohort) => cohort.isCurrent) ?? null;
  const candidateId = parseConfiguredCohortId(rawValue);
  const configuredCohort = candidateId
    ? (cohorts.find((cohort) => cohort.id === candidateId) ?? null)
    : null;
  const activeCohort = configuredCohort ?? currentCohort ?? cohorts[0] ?? null;

  return {
    cohorts,
    currentCohort,
    activeCohort,
    configuredCohortId: configuredCohort ? configuredCohort.id : null,
  };
}

export function parseSiteSettingsBoolean(raw: unknown, fallback: boolean): boolean {
  if (raw === undefined || raw === null) return fallback;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "object" && raw !== null && "enabled" in raw) {
    return Boolean((raw as { enabled?: boolean }).enabled);
  }
  return fallback;
}

async function readSiteSettingsBoolean(key: string, fallback: boolean): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return parseSiteSettingsBoolean(data?.value, fallback);
}

/** Reads `site_settings.inscriptions_enabled` (defaults to true if missing). */
export async function getInscriptionsEnabled(): Promise<boolean> {
  return readSiteSettingsBoolean("inscriptions_enabled", true);
}

/** Reads `site_settings.register_show_all_sections` (defaults to false if missing). */
export async function getRegisterShowAllSections(): Promise<boolean> {
  return readSiteSettingsBoolean("register_show_all_sections", false);
}

/** Loads non-archived cohorts and resolves the cohort active for public web registrations. */
export async function loadRegistrationCohortConfig(): Promise<RegistrationCohortConfig> {
  const supabase = await createClient();
  const [{ data: settingRow }, { data: cohortRows }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "registration_cohort_id")
      .maybeSingle(),
    supabase
      .from("academic_cohorts")
      .select("id, name, is_current")
      .is("archived_at", null)
      .order("starts_on", { ascending: false, nullsFirst: false })
      .order("name", { ascending: false }),
  ]);

  const cohorts: RegistrationCohortOption[] = ((cohortRows ?? []) as Array<{
    id: string;
    name: string;
    is_current: boolean | null;
  }>).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    isCurrent: row.is_current === true,
  }));

  return resolveRegistrationCohortState(cohorts, settingRow?.value ?? null);
}
