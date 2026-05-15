import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import { parseStudentRenewalWarnDays } from "@/lib/student/parseStudentRenewalWarnDays";

const KEY = "student_renewal_warn_days";

export const loadStudentRenewalWarnDays = cache(async (): Promise<number> => {
  const fallback = Number.parseInt(
    SYSTEM_PROPERTIES_DEFAULTS["student.enrollment.renewal.warn.days"] ?? "300",
    10,
  );
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", KEY)
      .maybeSingle();
    return parseStudentRenewalWarnDays(data?.value, fallback);
  } catch {
    return parseStudentRenewalWarnDays(null, fallback);
  }
});
