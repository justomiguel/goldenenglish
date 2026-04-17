import type { Metadata } from "next";
import Link from "next/link";
import { Palette } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminCmsHubPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const t = dict.admin.cms;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
          {t.hubTitle}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t.hubLead}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/${locale}/dashboard/admin/cms/templates`}
          className="group block rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] transition hover:border-[var(--color-primary)]/40 hover:shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            >
              <Palette className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                {t.templatesNav}
              </h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {t.templatesHubDescription}
              </p>
              <span className="mt-2 inline-flex items-center text-sm font-semibold text-[var(--color-primary)] group-hover:underline">
                {t.templatesHubCta}
              </span>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
