import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import {
  ACADEMICS_SECTION_DEFAULTS,
  parseAcademicsSectionDefaults,
  type AcademicsSectionDefaults,
} from "@/lib/academics/parseAcademicsSectionDefaults";

const KEY = "academics_section_defaults";

function tsDefaults(): AcademicsSectionDefaults {
  const maxRaw = SYSTEM_PROPERTIES_DEFAULTS["academics.section.max_students"];
  const rolesRaw =
    SYSTEM_PROPERTIES_DEFAULTS["academics.teacherPortal.allowedProfileRoles"];
  const maxParsed = Number.parseInt(maxRaw ?? "", 10);
  const maxStudents =
    Number.isFinite(maxParsed) && maxParsed > 0
      ? maxParsed
      : ACADEMICS_SECTION_DEFAULTS.maxStudents;
  const teacherPortalRoles = rolesRaw
    ? rolesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [...ACADEMICS_SECTION_DEFAULTS.teacherPortalRoles];
  return { maxStudents, teacherPortalRoles };
}

export const loadAcademicsSectionDefaults = cache(
  async (): Promise<AcademicsSectionDefaults> => {
    const defaults = tsDefaults();
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      return parseAcademicsSectionDefaults(data?.value, defaults);
    } catch {
      return defaults;
    }
  },
);
