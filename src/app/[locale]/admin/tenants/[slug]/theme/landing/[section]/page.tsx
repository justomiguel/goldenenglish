import { notFound, redirect } from "next/navigation";
import { LandingSectionEditorShell } from "@/components/dashboard/admin/cms/LandingSectionEditorShell";
import { loadLandingEditorSection } from "@/lib/cms/loadSiteThemeForLandingEditor";
import { loadPulsarThemeEditor } from "@/lib/pulsar/loadPulsarThemeEditor";
import { LANDING_SECTION_SLUGS, type LandingSectionSlug } from "@/types/theming";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; slug: string; section: string }>;
}

export default async function PulsarTenantThemeSectionPage({ params }: PageProps) {
  const { locale, slug, section } = await params;
  if (!LANDING_SECTION_SLUGS.includes(section as LandingSectionSlug)) notFound();
  const loaded = await loadPulsarThemeEditor(locale, slug);
  if (loaded.status === "login") {
    redirect(`/${locale}/cuenta/login?next=/${locale}/admin/tenants/${slug}/theme/landing/${section}`);
  }
  if (loaded.status === "password") redirect(`/${locale}/admin/password`);
  if (loaded.status !== "ready" || !loaded.themeId) notFound();

  const viewModel = await loadLandingEditorSection(
    loaded.supabase,
    loaded.themeId,
    section as LandingSectionSlug,
  );
  if (!viewModel) notFound();

  return (
    <LandingSectionEditorShell
      locale={locale}
      labels={loaded.dict.admin.cms.templates.landing}
      fileUploadProgress={loaded.dict.common.fileUpload}
      theme={viewModel.theme}
      section={viewModel.section}
      backHref={`/${locale}/admin/tenants/${slug}/theme/landing`}
    />
  );
}
