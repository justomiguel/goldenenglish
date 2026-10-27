import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminGlobalContentBuilder } from "@/components/admin/AdminGlobalContentBuilder";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { createClient } from "@/lib/supabase/server";
import { loadContentTemplateById } from "@/lib/learning-tasks/loadContentTemplateLibrary";

interface PageProps {
  params: Promise<{ locale: string; contentId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.adminContents.globalEditTitle,
    robots: { index: false, follow: false },
  };
}

export default async function EditGlobalContentPage({ params }: PageProps) {
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
      <AdminPageHeader title={labels.globalEditTitle} lead={content.title} iconId="contents" />
      <AdminGlobalContentBuilder locale={locale} labels={labels} editingContent={content} fileUploadProgress={dict.common.fileUpload} />
    </main>
  );
}
