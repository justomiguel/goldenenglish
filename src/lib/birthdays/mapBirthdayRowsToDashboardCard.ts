import type { PortalBirthdayRpcRow } from "@/types/birthdays";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export type UpcomingBirthdayCardRow = {
  studentId: string;
  displayName: string;
  celebrationIso: string;
  isToday: boolean;
  avatarUrl: string | null;
  sectionLabel: string | null;
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
    avatarUrl: null,
    sectionLabel: null,
  }));
}

export function mergeBirthdayCardDetails(
  rows: UpcomingBirthdayCardRow[],
  details: Map<string, { avatarUrl: string | null; sectionLabel: string | null }>,
): UpcomingBirthdayCardRow[] {
  return rows.map((row) => {
    const extra = details.get(row.studentId);
    if (!extra) return row;
    return {
      ...row,
      avatarUrl: extra.avatarUrl,
      sectionLabel: extra.sectionLabel,
    };
  });
}
