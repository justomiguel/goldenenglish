import { LearningTaskStatusBadge } from "@/components/molecules/LearningTaskStatusBadge";
import type { Dictionary } from "@/types/i18n";
import type { ParentLearningTaskRow } from "@/types/learningTasks";

interface ParentLearningTasksPanelProps {
  locale: string;
  tasks: ParentLearningTaskRow[];
  labels: Dictionary["dashboard"]["parent"];
  selectedStudentId?: string;
}

export function ParentLearningTasksPanel({
  locale,
  tasks,
  labels,
  selectedStudentId,
}: ParentLearningTasksPanelProps) {
  const visible = selectedStudentId
    ? tasks.filter((task) => task.studentId === selectedStudentId)
    : tasks;

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{labels.tasksTitle}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.tasksLead}</p>
      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{labels.tasksEmpty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {visible.map((task) => (
            <li key={`${task.studentId}:${task.taskInstanceId}`} className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{task.title}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {task.childLabel} · {task.sectionName} · {new Date(task.dueAt).toLocaleString(locale)}
                  </p>
                </div>
                <LearningTaskStatusBadge status={task.status} labels={labels.taskStatus} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
