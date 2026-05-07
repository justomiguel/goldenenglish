import type { PortalBirthdayRpcRow } from "@/types/birthdays";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export type UpcomingBirthdayCardRow = {
  studentId: string;
  displayName: string;
  celebrationIso: string;
  isToday: boolean;
};

export function mapBirthdayRowsToDashboardCard(rows: PortalBirthdayRpcRow[]): UpcomingBirthdayCardRow[] {
  return rows.map((r) => ({
    studentId: r.student_id,
    displayName: formatProfileSnakeSurnameFirst({
      first_name: r.first_name,
      last_name: r.last_name,
    }),
    celebrationIso: String(r.celebration_date).slice(0, 10),
    isToday: Boolean(r.is_celebration_today),
  }));
}
