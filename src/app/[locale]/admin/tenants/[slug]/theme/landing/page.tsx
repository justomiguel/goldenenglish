import { notFound, redirect } from "next/navigation";
import { LandingEditorOverview } from "@/components/dashboard/admin/cms/LandingEditorOverview";
import { loadLandingEditorOverview } from "@/lib/cms/loadSiteThemeForLandingEditor";
import { loadPulsarThemeEditor } from "@/lib/pulsar/loadPulsarThemeEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function PulsarTenantThemeLandingPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const loaded = await loadPulsarThemeEditor(locale, slug);
  if (loaded.status === "login") {
    redirect(`/${locale}/cuenta/login?next=/${locale}/admin/tenants/${slug}/theme/landing`);
  }
  if (loaded.status === "password") redirect(`/${locale}/admin/password`);
  if (loaded.status !== "ready" || !loaded.themeId) notFound();

  const viewModel = await loadLandingEditorOverview(loaded.supabase, loaded.themeId);
  if (!viewModel) notFound();
  const base = `/${locale}/admin/tenants/${slug}/theme`;

  return (
    <LandingEditorOverview
      locale={locale}
      labels={loaded.dict.admin.cms.templates.landing}
      theme={viewModel.theme}
      sections={viewModel.sections}
      backHref={base}
      sectionBaseHref={`${base}/landing`}
    />
  );
}
