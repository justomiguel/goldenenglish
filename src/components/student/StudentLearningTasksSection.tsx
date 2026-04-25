import Link from "next/link";
import { LearningTaskStatusBadge } from "@/components/molecules/LearningTaskStatusBadge";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { Dictionary } from "@/types/i18n";

interface StudentLearningTasksSectionProps {
  locale: string;
  tasks: StudentLearningTaskRow[];
  labels: Dictionary["dashboard"]["student"];
}

export function StudentLearningTasksSection({
  locale,
  tasks,
  labels,
}: StudentLearningTasksSectionProps) {
  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.tasksTitle}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.tasksLead}</p>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">{labels.tasksEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => (
            <li key={task.taskInstanceId}>
              <Link
                href={`/${locale}/dashboard/student/tasks/${task.taskInstanceId}`}
                className="block rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-muted)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--color-foreground)]">{task.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                      {task.sectionName} · {new Date(task.dueAt).toLocaleString(locale)}
                    </p>
                  </div>
                  <LearningTaskStatusBadge status={task.status} labels={labels.taskStatus} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
