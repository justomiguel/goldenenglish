import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadLandingEditorSection } from "@/lib/cms/loadSiteThemeForLandingEditor";
import { createLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import { LandingSectionEditorShell } from "@/components/dashboard/admin/cms/LandingSectionEditorShell";
import { LANDING_SECTION_SLUGS, type LandingSectionSlug } from "@/types/theming";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; id: string; section: string }>;
}

function toSectionSlug(raw: string): LandingSectionSlug | null {
  return LANDING_SECTION_SLUGS.includes(raw as LandingSectionSlug)
    ? (raw as LandingSectionSlug)
    : null;
}

export default async function AdminCmsLandingSectionPage({ params }: PageProps) {
  const { locale, id, section } = await params;
  const slug = toSectionSlug(section);
  if (!slug) notFound();

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
  const viewModel = await loadLandingEditorSection(supabase, id, slug);

  if (!viewModel) {
    return (
      <section className="space-y-4">
        <Link
          href={`/${locale}/dashboard/admin/cms/templates/${id}/landing`}
          className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft aria-hidden className="mr-1 h-4 w-4" />
          {labels.backToOverview}
        </Link>
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {labels.notFound}
        </p>
      </section>
    );
  }

  const publicUrlFor = createLandingMediaPublicUrlBuilder();

  return (
    <LandingSectionEditorShell
      locale={locale}
      labels={labels}
      theme={viewModel.theme}
      section={viewModel.section}
      publicUrlFor={publicUrlFor}
    />
  );
}
