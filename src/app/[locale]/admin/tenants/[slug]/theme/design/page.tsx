import { notFound, redirect } from "next/navigation";
import { ThemeDocumentEditorScreen } from "@/components/desktop/organisms/theme-document-editor/ThemeDocumentEditorScreen";
import { PulsarAdminChrome } from "@/components/organisms/pulsar/PulsarAdminChrome";
import { loadPulsarThemeEditor } from "@/lib/pulsar/loadPulsarThemeEditor";
import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { Locale } from "@/types/i18n";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function asLocale(value: string): Locale {
  if (value === "en" || value === "pt") return value;
  return "es";
}

export default async function PulsarTenantDesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ starter?: string | string[] }>;
}) {
  const { locale, slug } = await params;
  const query = await searchParams;
  const rawStarter = Array.isArray(query.starter) ? query.starter[0] : query.starter;
  const starterKind = rawStarter && isGenericInstituteKind(rawStarter) ? rawStarter : null;
  const loaded = await loadPulsarThemeEditor(locale, slug);
  if (loaded.status === "login") {
    redirect(`/${locale}/cuenta/login?next=/${locale}/admin/tenants/${slug}/theme/design`);
  }
  if (loaded.status === "password") redirect(`/${locale}/admin/password`);
  if (loaded.status !== "ready" || !loaded.themeId) notFound();
  const appLocale = asLocale(locale);

  return (
    <PulsarAdminChrome locale={locale} dict={loaded.dict} email={loaded.email}>
      <ThemeDocumentEditorScreen
        client={loaded.supabase}
        siteThemeId={loaded.themeId}
        locale={appLocale}
        actorRole="staff"
        tenantSlug={slug}
        dict={loaded.dict}
        starterNames={loaded.dict.pulsar.solutionSet.presencia.templateKinds}
        starterKind={starterKind}
      />
    </PulsarAdminChrome>
  );
}
