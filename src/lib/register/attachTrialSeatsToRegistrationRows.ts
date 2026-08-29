import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminRegistrationRow, AdminRegistrationTrialSeat } from "@/types/adminRegistration";

type SeatRow = {
  id: string;
  registration_id: string;
  section_id: string;
  scheduled_on: string;
  start_time: string;
  end_time: string;
  status: string;
};

export async function attachTrialSeatsToRegistrationRows(
  supabase: SupabaseClient,
  rows: AdminRegistrationRow[],
): Promise<AdminRegistrationRow[]> {
  const trialIds = rows.filter((r) => r.intent === "trial").map((r) => r.id);
  if (trialIds.length === 0) return rows;
  const { data, error } = await supabase
    .from("registration_trial_seats")
    .select("id, registration_id, section_id, scheduled_on, start_time, end_time, status")
    .in("registration_id", trialIds)
    .order("scheduled_on", { ascending: true });
  if (error || !data) return rows;
  const byLead = new Map<string, AdminRegistrationTrialSeat[]>();
  for (const raw of data as SeatRow[]) {
    const status = raw.status;
    if (
      status !== "booked" &&
      status !== "attended" &&
      status !== "absent" &&
      status !== "released"
    ) {
      continue;
    }
    const seat: AdminRegistrationTrialSeat = {
      id: String(raw.id),
      sectionId: String(raw.section_id),
      scheduledOn: String(raw.scheduled_on).slice(0, 10),
      startTime: String(raw.start_time).slice(0, 5),
      endTime: String(raw.end_time).slice(0, 5),
      status,
    };
    const list = byLead.get(String(raw.registration_id)) ?? [];
    list.push(seat);
    byLead.set(String(raw.registration_id), list);
  }
  return rows.map((row) =>
    row.intent === "trial" ? { ...row, trialSeats: byLead.get(row.id) ?? [] } : row,
  );
}
