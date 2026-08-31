import Link from "next/link";
import { ListChecks } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export function QuestionnairesSettingsCard({
  locale,
  labels,
}: {
  locale: string;
  labels: Dictionary["admin"]["settings"];
}) {
  return (
    <article className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <ListChecks className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-2">
          <h2 className="text-lg font-semibold">{labels.questionnairesCardTitle}</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.questionnairesCardLead}</p>
          <Link
            href={`/${locale}/dashboard/admin/settings/questionnaires`}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
          >
            {labels.questionnairesCardCta}
          </Link>
        </div>
      </div>
    </article>
  );
}
