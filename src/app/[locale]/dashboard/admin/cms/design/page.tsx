import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ThemeDocumentEditorScreen } from "@/components/desktop/organisms/theme-document-editor/ThemeDocumentEditorScreen";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import type { Locale } from "@/types/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function asLocale(value: string): Locale {
  if (value === "en" || value === "pt") return value;
  return "es";
}

export default async function AdminCmsDesignPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = asLocale(locale);
  let supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"];
  try {
    ({ supabase } = await assertAdmin());
  } catch (err) {
    const message = (err as Error)?.message;
    if (message === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (message === ADMIN_SESSION_FORBIDDEN) redirect(`/${locale}/dashboard`);
    throw err;
  }
  const dict = await getDictionary(appLocale);
  const theme = await supabase.from("site_themes").select("id").eq("is_active", true).limit(1).maybeSingle();
  const siteThemeId = typeof theme.data?.id === "string" ? theme.data.id : null;
  if (!siteThemeId) {
    return <p className="text-sm text-[var(--color-foreground)]">{dict.admin.designEditor.shell.missing}</p>;
  }
  return (
    <ThemeDocumentEditorScreen
      client={supabase}
      siteThemeId={siteThemeId}
      locale={appLocale}
      actorRole="admin"
      tenantSlug={getAlsTenant()?.slug ?? null}
      dict={dict}
      starterNames={dict.pulsar.solutionSet.presencia.templateKinds}
    />
  );
}
