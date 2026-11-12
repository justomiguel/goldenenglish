export const PWA_SHORTCUT_IDS = [
  "parent_payments",
  "parent_messages",
  "student_schedule",
  "student_tasks",
  "events",
] as const;

export type PwaShortcutId = (typeof PWA_SHORTCUT_IDS)[number];

const DEFAULT_SHORTCUTS: readonly PwaShortcutId[] = ["parent_payments", "parent_messages"];

export function parsePwaShortcuts(value: string | null): PwaShortcutId[] {
  if (!value?.trim()) return [...DEFAULT_SHORTCUTS];
  const ids = value
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is PwaShortcutId =>
      (PWA_SHORTCUT_IDS as readonly string[]).includes(part),
    );
  return ids.length > 0 ? ids : [...DEFAULT_SHORTCUTS];
}

export function pwaShortcutPath(id: PwaShortcutId, locale: string): string {
  switch (id) {
    case "parent_payments":
      return `/${locale}/dashboard/parent/payments`;
    case "parent_messages":
      return `/${locale}/dashboard/parent/messages`;
    case "student_schedule":
      return `/${locale}/dashboard/student/calendar`;
    case "student_tasks":
      return `/${locale}/dashboard/student/tasks`;
    case "events":
      return `/${locale}/events`;
  }
}
