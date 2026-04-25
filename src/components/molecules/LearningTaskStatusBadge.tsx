import type { TaskProgressStatus } from "@/lib/learning-tasks/types";

interface LearningTaskStatusBadgeProps {
  status: TaskProgressStatus;
  labels: Record<TaskProgressStatus, string>;
}

const tone: Record<TaskProgressStatus, string> = {
  NOT_OPENED: "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
  OPENED: "border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)]",
  COMPLETED: "border-[var(--color-success)] bg-[var(--color-surface)] text-[var(--color-success)]",
  COMPLETED_LATE: "border-[var(--color-error)] bg-[var(--color-surface)] text-[var(--color-error)]",
};

export function LearningTaskStatusBadge({ status, labels }: LearningTaskStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone[status]}`}>
      {labels[status]}
    </span>
  );
}
