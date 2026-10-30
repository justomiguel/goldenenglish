export type CourseProgressMode = "open" | "sequential";

export type LessonUnlockInput = {
  mode: CourseProgressMode;
  /** Flat index across modules, in sort order. The first lesson is 0. */
  lessonIndex: number;
  completedIndexes: ReadonlySet<number>;
};

/** Open courses unlock every lesson. Sequential courses unlock the next lesson after the previous one is complete. */
export function lessonIsUnlocked(input: LessonUnlockInput): boolean {
  if (input.mode === "open") return true;
  if (input.lessonIndex <= 0) return true;
  return input.completedIndexes.has(input.lessonIndex - 1);
}
