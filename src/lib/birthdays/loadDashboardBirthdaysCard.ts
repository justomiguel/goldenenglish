import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchPortalBirthdaysForViewer } from "@/lib/birthdays/fetchPortalBirthdaysForViewer";
import { instituteTwoWeekBirthdayRange } from "@/lib/birthdays/instituteTwoWeekBirthdayRange";
import {
  mapBirthdayRowsToDashboardCard,
  type UpcomingBirthdayCardRow,
} from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";

export async function loadDashboardBirthdaysCard(
  supabase: SupabaseClient,
  viewerId: string,
): Promise<UpcomingBirthdayCardRow[]> {
  const { startIso, endIso } = instituteTwoWeekBirthdayRange();
  const rows = await fetchPortalBirthdaysForViewer(supabase, viewerId, startIso, endIso);
  return mapBirthdayRowsToDashboardCard(rows);
}
