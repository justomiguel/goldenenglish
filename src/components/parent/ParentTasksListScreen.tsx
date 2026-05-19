import Link from "next/link";
import { Eye } from "lucide-react";
import { LearningTaskStatusBadge } from "@/components/molecules/LearningTaskStatusBadge";
import { ParentWardPicker, type ParentWardOption } from "@/components/parent/ParentWardPicker";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { Dictionary } from "@/types/i18n";

interface ParentTasksListScreenProps {
  locale: string;
  tasks: StudentLearningTaskRow[];
  wardOptions: ParentWardOption[];
  selectedStudentId: string | null;
  parentLabels: Dictionary["dashboard"]["parent"];
  studentLabels: Dictionary["dashboard"]["student"];
  embedded?: boolean;
}

export function ParentTasksListScreen({
  locale,
  tasks,
  wardOptions,
  selectedStudentId,
  parentLabels,
  studentLabels,
  embedded = false,
}: ParentTasksListScreenProps) {
  const basePath = `/${locale}/dashboard/parent/tasks`;
  return (
    <div className={embedded ? "space-y-3" : "space-y-6"}>
      {embedded ? null : (
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {parentLabels.tasksPageTitle}
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{parentLabels.tasksPageLead}</p>
        </header>
      )}

      {embedded ? null : (
        <ParentWardPicker
          options={wardOptions}
          selectedStudentId={selectedStudentId}
          label={parentLabels.wardPickerLabel}
          hint={parentLabels.wardPickerHint}
          basePath={basePath}
        />
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {parentLabels.tasksPageEmpty}
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.taskInstanceId}>
              <Link
                href={`${basePath}/${task.taskInstanceId}?studentId=${selectedStudentId}`}
                className="block rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-muted)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--color-foreground)]">
                      {task.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                      {task.sectionName} · {new Date(task.dueAt).toLocaleString(locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <LearningTaskStatusBadge
                      status={task.status}
                      labels={studentLabels.taskStatus}
                    />
                    <Eye className="h-4 w-4 text-[var(--color-muted-foreground)]" aria-hidden />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
