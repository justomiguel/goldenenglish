import type { Metadata } from "next";
import Link from "next/link";
import { AdminGlobalContentBuilder } from "@/components/admin/AdminGlobalContentBuilder";
import { getDictionary } from "@/lib/i18n/dictionaries";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.adminContents.globalCreateTitle,
    robots: { index: false, follow: false },
  };
}

export default async function NewGlobalContentPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const labels = dict.dashboard.adminContents;

  return (
    <main className="space-y-5">
      <header className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <Link href={`/${locale}/dashboard/admin/academic/contents`} className="text-sm font-medium text-[var(--color-primary)]">
          {labels.backToRepository}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">{labels.globalCreateTitle}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.globalFullPageLead}</p>
      </header>
      <AdminGlobalContentBuilder locale={locale} labels={labels} editingContent={null} />
    </main>
  );
}
