import Link from "next/link";
import { Lock } from "lucide-react";
import type { LandingQuestionnaireCard } from "@/lib/questionnaires/loadLandingQuestionnaires";
import type { Dictionary } from "@/types/i18n";

export function LandingQuestionnairesSection({
  locale,
  items,
  labels,
}: {
  locale: string;
  items: LandingQuestionnaireCard[];
  labels: Dictionary["landing"]["questionnaires"];
}) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-5xl px-4 py-12" aria-labelledby="landing-questionnaires-title">
      <h2 id="landing-questionnaires-title" className="mb-6 text-2xl font-semibold">
        {labels.title}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.slug}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{item.title}</h3>
              {item.visibility === "private" ? (
                <Lock className="h-4 w-4 shrink-0" aria-label={labels.privateAria} />
              ) : null}
            </div>
            <Link
              href={`/${locale}/q/${item.slug}`}
              className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
            >
              {labels.cta}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
