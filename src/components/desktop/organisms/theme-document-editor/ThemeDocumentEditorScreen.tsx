import type { SupabaseClient } from "@supabase/supabase-js";
import { DesignEditorShell } from "@/components/desktop/organisms/theme-document-editor/DesignEditorShell";
import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { applyThemeStarterAction } from "@/app/[locale]/dashboard/admin/cms/themeDocumentActions";
import { loadEditorFleetCounts } from "@/lib/theme-document/server/loadEditorFleetCounts";
import { loadThemeDocumentEditorModel } from "@/lib/theme-document/server/loadThemeDocumentEditorModel";
import type { Dictionary, Locale } from "@/types/i18n";

export async function ThemeDocumentEditorScreen({
  client,
  siteThemeId,
  locale,
  actorRole,
  tenantSlug,
  dict,
  starterNames,
  starterKind = null,
}: {
  client: SupabaseClient;
  siteThemeId: string;
  locale: Locale;
  actorRole: "staff" | "admin";
  tenantSlug: string | null;
  dict: Dictionary;
  starterNames: Record<string, string>;
  starterKind?: string | null;
}) {
  const fleetCountsPromise = loadEditorFleetCounts();
  let model = await loadThemeDocumentEditorModel(client, siteThemeId, dict, locale);
  if (model?.baseHash === null && starterKind && isGenericInstituteKind(starterKind)) {
    await applyThemeStarterAction({ locale, siteThemeId, kind: starterKind });
    model = await loadThemeDocumentEditorModel(client, siteThemeId, dict, locale);
  }
  const fleetCounts = await fleetCountsPromise;
  if (!model) {
    return <p className="text-sm text-[var(--color-foreground)]">{dict.admin.designEditor.shell.missing}</p>;
  }
  return (
    <DesignEditorShell
      locale={locale}
      siteThemeId={siteThemeId}
      actorRole={actorRole}
      tenantSlug={tenantSlug}
      document={model.document}
      baseHash={model.baseHash}
      versions={model.versions}
      labels={dict.admin.designEditor}
      issueMessages={dict.admin.themeDocument.issue}
      starterNames={starterNames}
      fleetCounts={fleetCounts}
    />
  );
}
