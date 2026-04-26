import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminLearningRoutePlanner } from "@/components/admin/AdminLearningRoutePlanner";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import {
  loadLearningRouteWorkspace,
  loadNewLearningRouteWorkspace,
} from "@/lib/learning-content/loadLearningRouteWorkspace";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.adminContents.learningRoutesTitle,
    robots: { index: false, follow: false },
  };
}

export default async function EditSectionContentPage({ params }: PageProps) {
  const { locale, sectionId } = await params;
  const dict = await getDictionary(locale);
  const labels = dict.dashboard.adminContents;
  const supabase = await createClient();
  const workspace = sectionId === "new"
    ? await loadNewLearningRouteWorkspace(supabase)
    : await loadLearningRouteWorkspace(supabase, sectionId === "global" ? null : sectionId);

  return (
    <main className="space-y-5">
      <header className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <Link href={`/${locale}/dashboard/admin/academic/contents/sections`} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {labels.backToRepository}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">{labels.learningRoutesTitle}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.learningRoutesLead}</p>
      </header>
      <AdminLearningRoutePlanner
        locale={locale}
        workspace={workspace}
        labels={labels}
      />
    </main>
  );
}
