import type { Dictionary } from "@/types/i18n";
import { ADMIN_HUB_CARD_RELIEF } from "@/lib/dashboard/adminHubCardRelief";
import type { FaqHomeCardModel } from "@/variants/owned/mozarthitos/pieces/loadFaqHomeCard";

interface FaqHomeCardProps {
  locale: string;
  dict: Dictionary;
  model: FaqHomeCardModel;
}

function failureText(code: string, copy: Dictionary["admin"]["home"]["faqMetrics"]): string {
  if (code === "load_failed") return copy.loadFailed;
  if (code === "stats_unavailable") return copy.statsUnavailable;
  return code;
}

export function FaqHomeCard({ locale, dict, model }: FaqHomeCardProps) {
  const copy = dict.admin.home.faqMetrics;
  const format = new Intl.NumberFormat(locale);
  const shell = `rounded-2xl border border-[var(--color-border)] p-5 ${ADMIN_HUB_CARD_RELIEF}`;

  if (!model.ok) {
    return (
      <section role="alert" className={shell}>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{copy.title}</h2>
        <p className="mt-2 text-sm text-[var(--color-foreground)]">{failureText(model.code, copy)}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="faq-home-title" className={shell}>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.window}</p>
      <h2 id="faq-home-title" className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
        {copy.title}
      </h2>
      <p className="mt-3 text-4xl font-bold tabular-nums text-[var(--color-foreground)]">
        {format.format(model.visits)}
      </p>
      <p className="text-sm text-[var(--color-foreground)]">{copy.people}</p>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{copy.hint}</p>
      <ul className="mt-4 divide-y divide-[var(--color-border)]">
        {model.rows.map((row) => (
          <li key={row.id} className="flex items-baseline justify-between gap-4 py-2">
            <span className="min-w-0 text-sm text-[var(--color-foreground)]">{row.question}</span>
            <span
              className="shrink-0 text-sm font-semibold tabular-nums text-[var(--color-foreground)]"
              aria-label={`${format.format(row.opens)} ${copy.opens}`}
            >
              {format.format(row.opens)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
