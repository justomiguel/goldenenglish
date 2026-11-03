export function courseFinishedAfterLesson(
  lessons: readonly { id: string; completed: boolean }[],
  lessonId: string,
): boolean {
  if (lessons.length === 0) return false;
  return lessons.every((lesson) => lesson.completed || lesson.id === lessonId);
}

export function nextCompletionWrite(input: {
  finished: boolean;
  existing: { revokedAt: string | null } | null;
}): "insert" | "restore" | "revoke" | "none" {
  if (input.finished && !input.existing) return "insert";
  if (input.finished && input.existing?.revokedAt) return "restore";
  if (!input.finished && input.existing && !input.existing.revokedAt) return "revoke";
  return "none";
}
