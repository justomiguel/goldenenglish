"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  resetSiteThemePropertiesAction,
  updateSiteThemePropertiesAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemePropertiesActions";
import type {
  SiteThemeActionErrorCode,
  SiteThemeActionResult,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import type { RawPropertyRow } from "@/lib/cms/buildRawPropertyRows";
import type { SiteThemeRow } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";
import { SiteThemeRawEditorAddForm } from "./SiteThemeRawEditorAddForm";
import { SiteThemeRawEditorTable } from "./SiteThemeRawEditorTable";
import {
  buildInitialRawEditorDraft,
  computeMergedRawKeys,
  computeVisibleRawRows,
  isRawEditorDraftDirty,
  type RawEditorDraft,
} from "./siteThemeRawEditorDraft";

type Labels = Dictionary["admin"]["cms"]["templates"]["properties"];

export interface SiteThemeRawEditorShellProps {
  locale: string;
  labels: Labels;
  theme: SiteThemeRow;
  rows: ReadonlyArray<RawPropertyRow>;
}

/**
 * Shell for the raw properties editor (PR 5).
 *
 * The admin mutates a single `draft` map in memory and submits the full
 * overrides payload to `updateSiteThemePropertiesAction`. The server-side
 * sanitizer (`cleanThemeOverridesForPersistence`) drops empty values and
 * values matching the default from `system.properties`, so this shell doesn't
 * need a bespoke "remove single override" action — it just omits the key from
 * the draft and lets the server persist the cleaned map.
 */
export function SiteThemeRawEditorShell({
  locale,
  labels,
  theme,
  rows,
}: SiteThemeRawEditorShellProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<RawEditorDraft>(() =>
    buildInitialRawEditorDraft(rows),
  );
  const [errorCode, setErrorCode] =
    useState<SiteThemeActionErrorCode | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = isRawEditorDraftDirty(rows, draft);
  const visibleRows = computeVisibleRawRows(rows, draft);
  const mergedKeys = computeMergedRawKeys(rows, draft);

  function resetFeedback() {
    setErrorCode(null);
    setSavedAt(null);
  }

  function handleFieldChange(key: string, value: string) {
    resetFeedback();
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleResetRow(key: string) {
    resetFeedback();
    setDraft((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleAdd(key: string, value: string) {
    resetFeedback();
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function applyResult(
    result: SiteThemeActionResult,
    onSuccess: () => void,
  ) {
    if (result.ok) {
      onSuccess();
      router.refresh();
      return;
    }
    setErrorCode(result.code);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateSiteThemePropertiesAction({
        locale,
        id: theme.id,
        overrides: draft,
      });
      applyResult(result, () => setSavedAt(Date.now()));
    });
  }

  function handleResetAll() {
    if (!window.confirm(labels.confirmResetAll)) return;
    startTransition(async () => {
      const result = await resetSiteThemePropertiesAction({
        locale,
        id: theme.id,
      });
      applyResult(result, () => {
        setDraft({});
        setSavedAt(Date.now());
      });
    });
  }

  return (
    <section className="space-y-6">
      <Link
        href={`/${locale}/dashboard/admin/cms/templates`}
        className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft aria-hidden className="mr-1 h-4 w-4" />
        {labels.backToTemplates}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
            {labels.title.replace("{{name}}", theme.name)}
          </h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)]">
            {theme.isActive ? labels.activeNotice : labels.draftNotice}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            disabled={pending}
          >
            {labels.resetAllCta}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={pending || !dirty}
            isLoading={pending}
          >
            {labels.saveCta}
          </Button>
        </div>
      </header>

      {errorCode ? (
        <p
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {labels.errors[errorCode] ?? labels.errors.persist_failed}
        </p>
      ) : null}

      {savedAt && !pending && !errorCode ? (
        <p
          role="status"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 px-3 py-2 text-sm text-[var(--color-success)]"
        >
          {labels.saveSuccess}
        </p>
      ) : null}

      <SiteThemeRawEditorAddForm
        labels={labels}
        existingKeys={mergedKeys}
        disabled={pending}
        onAdd={handleAdd}
      />

      <SiteThemeRawEditorTable
        labels={labels}
        rows={visibleRows}
        draft={draft}
        disabled={pending}
        onChange={handleFieldChange}
        onReset={handleResetRow}
        onRemove={handleResetRow}
      />
    </section>
  );
}
