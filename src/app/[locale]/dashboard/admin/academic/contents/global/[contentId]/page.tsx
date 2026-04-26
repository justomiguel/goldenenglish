import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminGlobalContentReadOnly } from "@/components/admin/AdminGlobalContentReadOnly";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadContentTemplateById } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ locale: string; contentId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.adminContents.globalViewTitle,
    robots: { index: false, follow: false },
  };
}

export default async function ViewGlobalContentPage({ params }: PageProps) {
  const { locale, contentId } = await params;
  const dict = await getDictionary(locale);
  const labels = dict.dashboard.adminContents;
  const supabase = await createClient();
  const content = await loadContentTemplateById(supabase, contentId);
  if (!content) notFound();

  return (
    <main className="space-y-5">
      <header className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <Link href={`/${locale}/dashboard/admin/academic/contents`} className="text-sm font-medium text-[var(--color-primary)]">
          {labels.backToRepository}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">{labels.globalViewTitle}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.globalViewLead}</p>
      </header>
      <AdminGlobalContentReadOnly locale={locale} content={content} labels={labels} />
    </main>
  );
}
