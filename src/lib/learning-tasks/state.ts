import type { TaskProgressStatus } from "@/lib/learning-tasks/types";

const allowedTransitions: Record<TaskProgressStatus, TaskProgressStatus[]> = {
  NOT_OPENED: ["OPENED"],
  OPENED: ["COMPLETED", "COMPLETED_LATE"],
  COMPLETED: [],
  COMPLETED_LATE: [],
};

export class InvalidStateTransitionException extends Error {
  constructor(from: TaskProgressStatus, to: TaskProgressStatus) {
    super(`Invalid task state transition: ${from} -> ${to}`);
    this.name = "InvalidStateTransitionException";
  }
}

export function assertTaskTransition(
  from: TaskProgressStatus,
  to: TaskProgressStatus,
): void {
  if (from === to) return;
  if (!allowedTransitions[from].includes(to)) {
    throw new InvalidStateTransitionException(from, to);
  }
}

export function resolveCompletionStatus(input: {
  currentStatus: TaskProgressStatus;
  dueAt: string | Date;
  completedAt: string | Date;
}): Extract<TaskProgressStatus, "COMPLETED" | "COMPLETED_LATE"> {
  const due = new Date(input.dueAt).getTime();
  const done = new Date(input.completedAt).getTime();
  if (!Number.isFinite(due) || !Number.isFinite(done)) {
    throw new Error("invalid_date");
  }
  const next = done > due ? "COMPLETED_LATE" : "COMPLETED";
  assertTaskTransition(input.currentStatus, next);
  return next;
}
