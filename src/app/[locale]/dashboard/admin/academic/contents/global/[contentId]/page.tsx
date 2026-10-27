import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminGlobalContentReadOnly } from "@/components/admin/AdminGlobalContentReadOnly";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
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
    <main className="space-y-4">
      <Link href={`/${locale}/dashboard/admin/academic/contents`} className="inline-flex min-h-9 items-center text-sm font-medium text-[var(--color-primary)] hover:underline">
        {labels.backToRepository}
      </Link>
      <AdminPageHeader title={labels.globalViewTitle} lead={labels.globalViewLead} iconId="contents" />
      <AdminGlobalContentReadOnly locale={locale} content={content} labels={labels} />
    </main>
  );
}
