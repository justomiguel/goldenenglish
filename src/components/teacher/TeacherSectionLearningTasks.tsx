"use client";

import { ClipboardList } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { assignTemplateToSectionAction } from "@/app/[locale]/dashboard/teacher/tasks/actions";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { TeacherLearningTaskRow } from "@/types/learningTasks";
import type { Dictionary } from "@/types/i18n";

interface TeacherSectionLearningTasksProps {
  locale: string;
  sectionId: string;
  templates: ContentTemplateLibraryRow[];
  tasks: TeacherLearningTaskRow[];
  labels: Dictionary["dashboard"]["teacherMySections"];
}

export function TeacherSectionLearningTasks({
  locale,
  sectionId,
  templates,
  tasks,
  labels,
}: TeacherSectionLearningTasksProps) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [startAt, setStartAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [isPending, startTransition] = useTransition();

  const assign = () => {
    startTransition(async () => {
      await assignTemplateToSectionAction({
        locale,
        sectionId,
        templateId,
        startAt: new Date(startAt).toISOString(),
        dueAt: new Date(dueAt).toISOString(),
      });
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{labels.tasksTitle}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.tasksLead}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="block text-sm font-medium text-[var(--color-foreground)]">
            {labels.taskAssignTitle}
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.title}</option>
              ))}
            </select>
          </label>
          <div>
            <Label htmlFor="task-start">{labels.taskAssignStart}</Label>
            <Input id="task-start" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="task-due">{labels.taskAssignDue}</Label>
            <Input id="task-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={assign} isLoading={isPending} disabled={!templateId || !startAt || !dueAt}>
              {!isPending ? <ClipboardList className="h-4 w-4 shrink-0" aria-hidden /> : null}
              {labels.taskAssignButton}
            </Button>
          </div>
        </div>
      </section>

      {tasks.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.tasksEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.taskInstanceId} className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="font-semibold text-[var(--color-foreground)]">{task.title}</p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {new Date(task.dueAt).toLocaleString(locale)} · {labels.tasksTotal.replace("{count}", String(task.total))}
              </p>
              <dl className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                <div>{labels.tasksNotOpened}: {task.notOpened}</div>
                <div>{labels.tasksOpened}: {task.opened}</div>
                <div>{labels.tasksCompleted}: {task.completed}</div>
                <div className="text-[var(--color-error)]">{labels.tasksCompletedLate}: {task.completedLate}</div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
