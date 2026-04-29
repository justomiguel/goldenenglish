import { LearningTaskStatusBadge } from "@/components/molecules/LearningTaskStatusBadge";
import { collapseRichTextDisplayHtml } from "@/lib/learning-tasks/collapseRichTextDisplayHtml";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { Dictionary } from "@/types/i18n";

interface ParentTaskDetailScreenProps {
  locale: string;
  task: StudentLearningTaskRow;
  studentLabels: Dictionary["dashboard"]["student"];
  readOnlyNotice: string;
}

export function ParentTaskDetailScreen({
  locale,
  task,
  studentLabels,
  readOnlyNotice,
}: ParentTaskDetailScreenProps) {
  const bodyHtml = collapseRichTextDisplayHtml(task.bodyHtml ?? "");

  return (
    <article className="space-y-5">
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {task.sectionName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">
              {task.title}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {new Date(task.dueAt).toLocaleString(locale)}
            </p>
          </div>
          <LearningTaskStatusBadge
            status={task.status}
            labels={studentLabels.taskStatus}
          />
        </div>
        <div
          className="prose prose-sm mx-auto mt-5 w-full max-w-prose overflow-x-auto text-[var(--color-foreground)] [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:min-h-0 [&_iframe]:w-full [&_iframe]:max-w-full [&_img]:max-w-full [&_p:empty]:hidden [&_p]:my-2 [&_table]:max-w-full [&_table]:text-sm"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </div>

      {task.assets.length > 0 ? (
        <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="font-semibold text-[var(--color-foreground)]">
            {studentLabels.taskAssetsTitle}
          </h2>
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

      <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
        {readOnlyNotice}
      </p>
    </article>
  );
}
