import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, ListChecks } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminFirstClassChecklist } from "@/lib/dashboard/evaluateAdminFirstClassChecklist";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

type Labels = Dictionary["admin"]["home"]["firstClassChecklist"];

interface AdminFirstClassChecklistCardProps {
  labels: Labels;
  checklist: AdminFirstClassChecklist;
}

export function AdminFirstClassChecklistCard({
  labels,
  checklist,
}: AdminFirstClassChecklistCardProps) {
  const progress = labels.progress
    .replace("{{done}}", String(checklist.doneCount))
    .replace("{{total}}", String(checklist.totalCount));

  return (
    <section
      data-tour={ADMIN_TOUR_ANCHORS.hubFirstClassChecklist}
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <ListChecks className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
              {labels.title}
            </h2>
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
              {progress}
            </p>
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {labels.lead}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {checklist.items.map((item) => {
          const label = labels.items[item.id];
          const icon = item.done ? (
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden
            />
          ) : (
            <Circle
              className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
              aria-hidden
            />
          );

          if (item.done) {
            return (
              <li
                key={item.id}
                className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] line-through"
              >
                {icon}
                <span>{label}</span>
              </li>
            );
          }

          const goDoItAria = labels.goDoItAria.replace("{{item}}", label);

          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 font-medium text-[var(--color-foreground)]">
                {icon}
                <span>{label}</span>
              </span>
              <Link
                href={item.href}
                aria-label={goDoItAria}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                <span>{labels.goDoIt}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
