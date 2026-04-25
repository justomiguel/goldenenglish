export function validateTaskDateRange(startAt: string | Date, dueAt: string | Date): void {
  const start = new Date(startAt).getTime();
  const due = new Date(dueAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(due)) {
    throw new Error("invalid_date");
  }
  if (due < start) {
    throw new Error("due_before_start");
  }
}
