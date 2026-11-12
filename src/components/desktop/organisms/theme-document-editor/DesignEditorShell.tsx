"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Paintbrush, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  applyThemeStarterAction,
  discardThemeDraft,
  publishThemeDraft,
  rollbackTheme,
  saveThemeDraft,
} from "@/app/[locale]/dashboard/admin/cms/themeDocumentActions";
import { IdentityTab } from "@/components/desktop/organisms/theme-document-editor/identity/IdentityTab";
import { PagesTab } from "@/components/desktop/organisms/theme-document-editor/pages/PagesTab";
import { SectionTab } from "@/components/desktop/organisms/theme-document-editor/section/SectionTab";
import { PublishIssuesPanel } from "@/components/desktop/organisms/theme-document-editor/publish/PublishIssuesPanel";
import { VersionsTab } from "@/components/desktop/organisms/theme-document-editor/versions/VersionsTab";
import type { UpgradeTarget } from "@/components/desktop/organisms/theme-document-editor/versions/UpgradeRow";
import { getVariant, variantsForTenant } from "@/lib/design-variants/variantRegistry";
import { trackEvent } from "@/lib/analytics/trackClient";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";
import { themeDocumentIssueMessage } from "@/lib/theme-document/themeDocumentIssueMessage";
import type { EditorVersionRow } from "@/lib/theme-document/server/loadThemeDocumentEditorModel";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { usePersistentPageTab } from "@/hooks/usePersistentPageTab";
import { useThemeDocumentEditor } from "@/hooks/useThemeDocumentEditor";
import type { Dictionary, Locale } from "@/types/i18n";

const TABS = ["identity", "pages", "section", "versions"] as const;

type EditorLabels = Dictionary["admin"]["designEditor"];

export function DesignEditorShell({
  locale,
  siteThemeId,
  actorRole,
  tenantSlug,
  document,
  baseHash,
  versions,
  labels,
  issueMessages,
  starterNames,
  fleetCounts,
}: {
  locale: Locale;
  siteThemeId: string;
  actorRole: "staff" | "admin";
  tenantSlug: string | null;
  document: ThemeDocumentV1;
  baseHash: string | null;
  versions: readonly EditorVersionRow[];
  labels: EditorLabels;
  issueMessages: Record<string, string>;
  starterNames: Record<string, string>;
  fleetCounts: Record<string, number>;
}) {
  const router = useRouter();
  const { value, setValue } = usePersistentPageTab({ allowed: TABS, fallback: "identity" });
  const [starterError, setStarterError] = useState<string | null>(null);
  const editor = useThemeDocumentEditor({
    locale,
    siteThemeId,
    actorRole,
    initial: {
      document,
      baseHash,
      versions: versions.map((row) => ({
        id: row.id,
        version: row.version,
        documentHash: row.documentHash,
        publishedAt: row.publishedOn,
      })),
    },
    actions: {
      save: async (input) => {
        const result = await saveThemeDraft(input);
        if (!result.ok) return result;
        return { ok: true, data: { documentHash: result.data.hash } };
      },
      publish: async (input) => {
        if (!input.expectedHash) return { ok: false, code: "draft_missing" };
        const result = await publishThemeDraft({ ...input, expectedHash: input.expectedHash });
        if (!result.ok) return result;
        return { ok: true, data: { version: result.data.version } };
      },
      discard: async (input) => {
        const result = await discardThemeDraft(input);
        if (!result.ok) return result;
        return { ok: true, data: { discarded: true } };
      },
      rollback: async (input) => {
        const result = await rollbackTheme(input);
        if (!result.ok) return result;
        return { ok: true, data: { version: result.data.version } };
      },
    },
  });
  const current = editor.data.document.sections[0];
  const fields = current ? (getVariant(current.variantId, current.major)?.editorFields ?? []) : [];

  function latestMajorFor(id: string): number | null {
    let latest: number | null = null;
    for (const variant of variantsForTenant(tenantSlug)) {
      if (variant.id !== id) continue;
      if (latest === null || variant.major > latest) latest = variant.major;
    }
    return latest;
  }

  function findVariant(id: string, major: number): UpgradeTarget | null {
    const variant = getVariant(id, major);
    if (!variant) return null;
    return { id: variant.id, major: variant.major, propsSchema: variant.propsSchema, migrateProps: variant.migrateProps };
  }

  async function applyStarter(kind: string) {
    setStarterError(null);
    const result = await applyThemeStarterAction({ locale, siteThemeId, kind });
    if (!result.ok) {
      setStarterError(themeDocumentIssueMessage(issueMessages, result.code, { path: result.path }));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={value === tab}
            className="inline-flex min-h-[44px] items-center rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-foreground)]"
            onClick={() => setValue(tab)}
          >
            {labels.shell[tab]}
          </button>
        ))}
      </div>
      {value === "identity" ? (
        <IdentityTab
          document={editor.data.document}
          tenantSlug={tenantSlug}
          actorRole={actorRole}
          isLocked={editor.handlers.isLocked}
          onApply={editor.handlers.apply}
          labels={labels.identity}
        />
      ) : null}
      {value === "pages" ? (
        <PagesTab
          document={editor.data.document}
          tenantSlug={tenantSlug}
          isLocked={editor.handlers.isLocked}
          onApply={editor.handlers.apply}
          labels={labels.pages}
        />
      ) : null}
      {value === "section" && current ? (
        <SectionTab
          scope="home"
          section={current}
          fields={fields}
          fieldLabels={{}}
          labels={labels.section}
          onApply={editor.handlers.apply}
        />
      ) : null}
      {value === "section" && !current ? <p className="text-sm text-[var(--color-foreground)]">{labels.pages.empty}</p> : null}
      {value === "versions" ? (
        <VersionsTab
          rows={versions}
          sections={editor.data.document.sections}
          actorRole={actorRole}
          editableBy={editor.data.document.editableBy}
          latestMajorFor={latestMajorFor}
          findVariant={findVariant}
          labels={labels.versions}
          upgradeLabels={labels.upgrade}
          fleetCountFor={(id, major) => fleetCounts[`${id}@${major}`] ?? 0}
          issueMessages={issueMessages}
          onApply={editor.handlers.apply}
          onRollback={(snapshotId) => {
            trackEvent("click", "admin:theme-document", { action: "rollback" });
            void editor.handlers.rollback(snapshotId);
          }}
        />
      ) : null}
      {editor.data.issues.length > 0 ? (
        <PublishIssuesPanel
          issues={editor.data.issues}
          messages={issueMessages}
          onOpenField={(path) => setValue(path.startsWith("sections.") || path.startsWith("pages.") ? "section" : "identity")}
        />
      ) : null}
      {editor.error ? (
        <p role="alert" className="text-sm text-[var(--color-foreground)]">
          {themeDocumentIssueMessage(issueMessages, editor.error.code, { path: editor.error.path })}
        </p>
      ) : null}
      {starterError ? <p role="alert" className="text-sm text-[var(--color-foreground)]">{starterError}</p> : null}
      {baseHash === null && !editor.data.dirty ? (
        <div className="flex flex-wrap gap-2">
          {GENERIC_INSTITUTE_KINDS.map((kind) => (
            <Button key={kind} type="button" variant="ghost" onClick={() => void applyStarter(kind)}>
              <Paintbrush className="h-4 w-4" aria-hidden />
              {labels.shell.applyStarter.replaceAll("{name}", starterNames[kind] ?? kind)}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" isLoading={editor.isLoading} onClick={() => void editor.handlers.save()}>
          <Save className="h-4 w-4" aria-hidden />
          {labels.shell.save}
        </Button>
        <Button
          type="button"
          variant="secondary"
          isLoading={editor.isLoading}
          onClick={() => {
            trackEvent("click", "admin:theme-document", { action: "publish" });
            void editor.handlers.publish();
          }}
        >
          <Upload className="h-4 w-4" aria-hidden />
          {labels.shell.publish}
        </Button>
        <Button type="button" variant="destructive" isLoading={editor.isLoading} onClick={() => void editor.handlers.discard()}>
          <Trash2 className="h-4 w-4" aria-hidden />
          {labels.shell.discard}
        </Button>
      </div>
    </div>
  );
}
