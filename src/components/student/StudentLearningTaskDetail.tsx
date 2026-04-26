"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { LearningTaskStatusBadge } from "@/components/molecules/LearningTaskStatusBadge";
import { useTaskEngagementTimer } from "@/hooks/useTaskEngagementTimer";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { Dictionary } from "@/types/i18n";
import {
  completeTaskAction,
  markTaskOpenedAfterEngagementAction,
} from "@/app/[locale]/dashboard/student/tasks/actions";
import { collapseRichTextDisplayHtml } from "@/lib/learning-tasks/collapseRichTextDisplayHtml";

interface StudentLearningTaskDetailProps {
  locale: string;
  task: StudentLearningTaskRow;
  labels: Dictionary["dashboard"]["student"];
}

export function StudentLearningTaskDetail({ locale, task, labels }: StudentLearningTaskDetailProps) {
  const bodyHtml = collapseRichTextDisplayHtml(task.bodyHtml ?? "");
  const [status, setStatus] = useState(task.status);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useTaskEngagementTimer({
    enabled: status === "NOT_OPENED",
    onEngaged: () => {
      startTransition(async () => {
        const result = await markTaskOpenedAfterEngagementAction({
          locale,
          taskInstanceId: task.taskInstanceId,
        });
        if (result.ok) setStatus(result.status);
      });
    },
  });

  const complete = () => {
    startTransition(async () => {
      const result = await completeTaskAction({ locale, taskInstanceId: task.taskInstanceId });
      if (result.ok) {
        setStatus(result.status);
        setMessage(labels.taskCompleted);
      } else {
        setMessage(labels.taskCompletionError);
      }
    });
  };

  return (
    <article className="space-y-5">
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--color-muted-foreground)]">{task.sectionName}</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">{task.title}</h1>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {labels.taskEngagementHint}
            </p>
          </div>
          <LearningTaskStatusBadge status={status} labels={labels.taskStatus} />
        </div>
        <div
          className="prose prose-sm mx-auto mt-5 w-full max-w-prose overflow-x-auto text-[var(--color-foreground)] [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:min-h-0 [&_iframe]:w-full [&_iframe]:max-w-full [&_img]:max-w-full [&_p:empty]:hidden [&_p]:my-2 [&_table]:max-w-full [&_table]:text-sm"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </div>

      {task.assets.length > 0 ? (
        <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="font-semibold text-[var(--color-foreground)]">{labels.taskAssetsTitle}</h2>
          <ul className="mt-3 space-y-3">
            {task.assets.map((asset) => (
              <li key={asset.id} className="text-sm text-[var(--color-foreground)]">
                {asset.kind === "embed" ? (
                  <iframe
                    src={asset.embedUrl}
                    title={asset.label}
                    className="aspect-video w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)]"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <span>{asset.label}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={complete}
          isLoading={isPending}
          disabled={status === "NOT_OPENED" || status === "COMPLETED" || status === "COMPLETED_LATE"}
        >
          {!isPending ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {labels.taskComplete}
        </Button>
        {message ? <p className="text-sm text-[var(--color-muted-foreground)]">{message}</p> : null}
      </div>
    </article>
  );
}
