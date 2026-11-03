"use server";

import {
  joinSectionDailyClass,
  type JoinSectionDailyClassResult,
} from "@/lib/academics/joinSectionDailyClass";

export type JoinSectionDailyClassActionResult = JoinSectionDailyClassResult;

export async function joinSectionDailyClassAction(input: {
  sectionId: string;
  requested: { dayOfWeek: number; startTime: string } | null;
}): Promise<JoinSectionDailyClassActionResult> {
  return joinSectionDailyClass(input);
}
