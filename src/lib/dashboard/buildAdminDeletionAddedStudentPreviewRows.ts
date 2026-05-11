import {
  compareProfileSnakeByLastThenFirst,
  formatProfileSnakeSurnameFirst,
} from "@/lib/profile/formatProfileDisplayName";

export type AdminDeletionAddedStudentPreviewRow = {
  id: string;
  label: string;
};

type ProfileSnake = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
};

/** Labels for student accounts pulled in by guardian deletion (admin preview). */
export function buildAdminDeletionAddedStudentPreviewRows(
  addedStudentIds: string[],
  profiles: ProfileSnake[],
): AdminDeletionAddedStudentPreviewRow[] {
  const byId = new Map(profiles.map((p) => [String(p.id), p]));
  const merged: ProfileSnake[] = addedStudentIds.map((id) => {
    const row = byId.get(id);
    return row ?? { id, first_name: null, last_name: null };
  });
  merged.sort((a, b) => compareProfileSnakeByLastThenFirst(a, b));
  return merged.map((row) => ({
    id: String(row.id),
    label: formatProfileSnakeSurnameFirst(row, String(row.id)),
  }));
}
