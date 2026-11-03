export type ProgramSetCompletion = "all_in_order" | "all_any_order" | "at_least";

export function isProgramSetComplete(input: {
  completion: ProgramSetCompletion;
  atLeastCount: number | null;
  courseIdsInOrder: string[];
  completedCourseIds: ReadonlySet<string>;
}): boolean {
  const completed = input.courseIdsInOrder.filter((id) => input.completedCourseIds.has(id)).length;
  if (input.completion === "at_least") return completed >= (input.atLeastCount ?? 1);
  return input.courseIdsInOrder.length > 0 && completed === input.courseIdsInOrder.length;
}

export function nextLockedCourseId(input: {
  completion: ProgramSetCompletion;
  courseIdsInOrder: string[];
  completedCourseIds: ReadonlySet<string>;
}): string | null {
  if (input.completion !== "all_in_order") return null;
  return input.courseIdsInOrder.find((id) => !input.completedCourseIds.has(id)) ?? null;
}
