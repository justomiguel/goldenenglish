import type { SupabaseClient } from "@supabase/supabase-js";

export type TrialVisitorRow = {
  seatId: string;
  registrationId: string;
  studentName: string;
  scheduledOn: string;
  startTime: string;
  endTime: string;
  status: "booked" | "attended" | "absent";
};

type SeatRow = {
  id: string;
  registration_id: string;
  scheduled_on: string;
  start_time: string;
  end_time: string;
  status: string;
  registration: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function loadTrialVisitorsForSection(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<TrialVisitorRow[]> {
  const { data, error } = await supabase
    .from("registration_trial_seats")
    .select(
      "id, registration_id, scheduled_on, start_time, end_time, status, registration:registrations(first_name, last_name)",
    )
    .eq("section_id", sectionId)
    .in("status", ["booked", "attended", "absent"])
    .order("scheduled_on", { ascending: true })
    .limit(200);
  if (error || !data) return [];
  return (data as SeatRow[])
    .map((row) => {
      const status = row.status;
      if (status !== "booked" && status !== "attended" && status !== "absent") return null;
      const lead = one(row.registration);
      return {
        seatId: String(row.id),
        registrationId: String(row.registration_id),
        studentName: `${lead?.first_name ?? ""} ${lead?.last_name ?? ""}`.trim() || "—",
        scheduledOn: String(row.scheduled_on).slice(0, 10),
        startTime: String(row.start_time).slice(0, 5),
        endTime: String(row.end_time).slice(0, 5),
        status,
      } satisfies TrialVisitorRow;
    })
    .filter((row): row is TrialVisitorRow => row != null);
}
