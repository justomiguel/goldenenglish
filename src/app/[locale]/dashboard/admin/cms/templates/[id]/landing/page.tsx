import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadLandingEditorOverview } from "@/lib/cms/loadSiteThemeForLandingEditor";
import { LandingEditorOverview } from "@/components/dashboard/admin/cms/LandingEditorOverview";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminCmsLandingOverviewPage({ params }: PageProps) {
  const { locale, id } = await params;

  let supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"];
  try {
    ({ supabase } = await assertAdmin());
  } catch (err) {
    const message = (err as Error)?.message;
    if (message === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (message === ADMIN_SESSION_FORBIDDEN) redirect(`/${locale}/dashboard`);
    throw err;
  }

  const dict = await getDictionary(locale);
  const labels = dict.admin.cms.templates.landing;
  const viewModel = await loadLandingEditorOverview(supabase, id);

  if (!viewModel) {
    return (
      <section className="space-y-4">
        <Link
          href={`/${locale}/dashboard/admin/cms/templates`}
          className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft aria-hidden className="mr-1 h-4 w-4" />
          {labels.backToTemplates}
        </Link>
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {labels.notFound}
        </p>
      </section>
    );
  }

  return (
    <LandingEditorOverview
      locale={locale}
      labels={labels}
      theme={viewModel.theme}
      sections={viewModel.sections}
    />
  );
}
