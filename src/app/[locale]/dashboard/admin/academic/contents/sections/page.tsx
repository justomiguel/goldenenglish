import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadGlobalLearningRouteOptions } from "@/lib/learning-content/loadLearningRouteWorkspace";
import { AdminLearningRoutesGrid } from "@/components/admin/AdminLearningRoutesGrid";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.adminContents.learningRoutesTitle,
    robots: { index: false, follow: false },
  };
}

export default async function SectionContentPickerPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const labels = dict.dashboard.adminContents;
  const supabase = await createClient();
  const routes = await loadGlobalLearningRouteOptions(supabase);

  return (
    <main className="space-y-5">
      <header className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <Link
          href={`/${locale}/dashboard/admin/academic/contents?tab=routes`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {labels.backToRepository}
        </Link>
        <div className="mt-3">
          <AdminPageHeader title={labels.learningRoutesTitle} lead={labels.learningRoutesLead} iconId="contents" />
        </div>
      </header>
      <AdminLearningRoutesGrid locale={locale} routes={routes} labels={labels} />
    </main>
  );
}
