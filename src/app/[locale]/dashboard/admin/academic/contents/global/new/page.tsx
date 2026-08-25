import type { Metadata } from "next";
import Link from "next/link";
import { AdminGlobalContentBuilder } from "@/components/admin/AdminGlobalContentBuilder";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

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
        <div className="mt-3">
          <AdminPageHeader title={labels.globalCreateTitle} lead={labels.globalFullPageLead} iconId="contents" />
        </div>
      </header>
      <AdminGlobalContentBuilder locale={locale} labels={labels} editingContent={null} fileUploadProgress={dict.common.fileUpload} />
    </main>
  );
}
