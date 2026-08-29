import {
  compareProfileSnakeByLastThenFirst,
  formatProfileSnakeSurnameFirst,
  type ProfileNameSnake,
} from "@/lib/profile/formatProfileDisplayName";

export type SectionDeleteEnrollmentPreview = {
  id: string;
  studentId: string;
  label: string;
  status: string;
};

export type SectionDeleteEnrollmentRaw = {
  id: string;
  status: string;
  student_id: string;
  profiles: ProfileNameSnake | ProfileNameSnake[] | null;
};

function unwrapProfile(raw: SectionDeleteEnrollmentRaw["profiles"]): ProfileNameSnake | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export function mapSectionDeleteEnrollmentPreview(
  rows: SectionDeleteEnrollmentRaw[],
): SectionDeleteEnrollmentPreview[] {
  return [...rows]
    .map((row) => {
      const profile = unwrapProfile(row.profiles);
      return { row, profile };
    })
    .sort((a, b) => {
      if (!a.profile && !b.profile) return 0;
      if (!a.profile) return 1;
      if (!b.profile) return -1;
      return compareProfileSnakeByLastThenFirst(a.profile, b.profile);
    })
    .map(({ row, profile }) => ({
      id: row.id,
      studentId: row.student_id,
      label: profile ? formatProfileSnakeSurnameFirst(profile, row.student_id) : row.student_id,
      status: row.status,
    }));
}
