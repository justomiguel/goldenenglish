import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { adminHomeOpsWindow } from "@/lib/dashboard/adminHomeOpsWindow";
import {
  parseAdminHomeOpsSnapshot,
  type AdminHomeOpsSnapshot,
} from "@/lib/dashboard/parseAdminHomeOpsSnapshot";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function loadAdminHomeOpsSnapshot(
  supabase: SupabaseClient,
  now: Date = new Date(),
  timeZone: string = getInstituteTimeZone(),
): Promise<AdminHomeOpsSnapshot | null> {
  try {
    const window = adminHomeOpsWindow(now, timeZone);
    const { data, error } = await supabase.rpc("admin_home_ops_snapshot", {
      p_today: window.today,
      p_week_start: window.weekStart,
      p_week_end: window.weekEnd,
      p_weekday: window.weekday,
    });
    if (error) {
      logSupabaseClientError("adminHome.opsSnapshot", error, {});
      return null;
    }
    return parseAdminHomeOpsSnapshot(data);
  } catch (err) {
    logServerException("adminHome.opsSnapshot", err);
    return null;
  }
}
