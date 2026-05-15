import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  ACADEMICS_ATTENDANCE_MATRIX_DEFAULTS,
  parseAcademicsAttendanceMatrix,
  type AcademicsAttendanceMatrixValues,
} from "@/lib/academics/parseAcademicsAttendanceMatrix";

const KEY = "academics_attendance_matrix";

export const loadAcademicsAttendanceMatrix = cache(
  async (): Promise<AcademicsAttendanceMatrixValues> => {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      return parseAcademicsAttendanceMatrix(
        data?.value,
        ACADEMICS_ATTENDANCE_MATRIX_DEFAULTS,
      );
    } catch {
      return ACADEMICS_ATTENDANCE_MATRIX_DEFAULTS;
    }
  },
);
