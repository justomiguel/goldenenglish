import Link from "next/link";
import { CalendarDays, Newspaper, Percent, Rocket } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

const boostLink =
  "inline-flex min-h-10 items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-secondary-foreground)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary-foreground)_12%,transparent)] px-3 text-sm font-medium text-[var(--color-secondary-foreground)] transition hover:bg-[color-mix(in_srgb,var(--color-secondary-foreground)_20%,transparent)]";

export function AdminHubHomeBoost({
  base,
  dict,
  includeBlog,
}: {
  base: string;
  dict: Dictionary;
  includeBlog: boolean;
}) {
  return (
    <div
      data-tour="admin-hub-boost"
      className="flex shrink-0 flex-col gap-4 rounded-2xl bg-[var(--color-secondary)] px-5 py-5 text-[var(--color-secondary-foreground)] shadow-[var(--shadow-soft)] md:flex-row md:items-center md:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 shrink-0 text-[var(--color-secondary-foreground)]" aria-hidden />
          <h2 className="text-base font-semibold text-[var(--color-secondary-foreground)]">
            {dict.admin.home.boost.title}
          </h2>
        </div>
        <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--color-secondary-foreground)_88%,var(--color-secondary))]">
          {dict.admin.home.boost.lead}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`${base}/events/new`} className={boostLink}>
          <CalendarDays className="h-4 w-4" aria-hidden />
          {dict.admin.home.boost.event}
        </Link>
        <Link href={`${base}/promotions`} className={boostLink}>
          <Percent className="h-4 w-4" aria-hidden />
          {dict.admin.home.boost.promotion}
        </Link>
        {includeBlog ? (
          <Link href={`${base}/cms/blog`} className={boostLink}>
            <Newspaper className="h-4 w-4" aria-hidden />
            {dict.admin.home.boost.blog}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
