"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { TokenGroup, TokenGroupId } from "@/lib/cms/groupThemeTokens";
import {
  resetSiteThemePropertiesAction,
  updateSiteThemePropertiesAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemePropertiesActions";
import type {
  SiteThemeActionErrorCode,
  SiteThemeActionResult,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import type { SiteThemeRow } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";
import {
  SiteThemeEditorBackLink,
} from "./SiteThemeEditorTokenField";
import { SiteThemeEditorGroupCard } from "./SiteThemeEditorGroupCard";
import { SiteThemeEditorPreview } from "./SiteThemeEditorPreview";
import { buildInitialDraft } from "./siteThemeEditorDraft";

type Labels = Dictionary["admin"]["cms"]["templates"]["editor"];

export interface SiteThemeEditorShellProps {
  locale: string;
  labels: Labels;
  theme: SiteThemeRow;
  groups: ReadonlyArray<TokenGroup>;
}

function groupLabels(labels: Labels, id: TokenGroupId) {
  const map = labels.groups;
  return {
    title: map[id].title,
    description: map[id].description,
    resetToDefault: labels.resetToDefault,
    defaultLabel: labels.defaultLabel,
    overriddenLabel: labels.overriddenLabel,
  };
}

/**
 * Stateful shell for the design system editor. Keeps the editing draft in
 * memory so admins can iterate over multiple tokens before persisting; the
 * server action is invoked once on save with the full overrides map.
 *
 * The draft is initialized lazily from the loaded view-model. Lazy initial
 * state (vs `useEffect` + `setState`) keeps React Compiler happy and avoids
 * resetting in-flight edits on subsequent renders, per the patterns adopted
 * across the admin shell.
 */
export function SiteThemeEditorShell({
  locale,
  labels,
  theme,
  groups,
}: SiteThemeEditorShellProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    buildInitialDraft(groups),
  );
  const [errorCode, setErrorCode] =
    useState<SiteThemeActionErrorCode | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isDirty = isDraftDirty(groups, draft);

  function setTokenValue(key: string, value: string) {
    setSavedAt(null);
    setErrorCode(null);
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function resetToken(key: string) {
    const def = findDefaultValue(groups, key);
    setTokenValue(key, def);
  }

  function applyResult(result: SiteThemeActionResult, onSuccess: () => void) {
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
      applyResult(result, () => {
        setSavedAt(Date.now());
      });
    });
  }

  function runResetAll() {
    startTransition(async () => {
      const result = await resetSiteThemePropertiesAction({
        locale,
        id: theme.id,
      });
      applyResult(result, () => {
        setDraft(emptyDraftFromGroups(groups));
        setSavedAt(Date.now());
      });
    });
  }

  return (
    <section className="space-y-6">
      <SiteThemeEditorBackLink
        href={`/${locale}/dashboard/admin/cms/templates`}
        label={labels.backToTemplates}
      />

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
            onClick={() => setResetAllOpen(true)}
            disabled={pending}
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
            {labels.resetAllCta}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={pending || !isDirty}
            isLoading={pending}
          >
            {!pending ? (
              <Save className="h-4 w-4 shrink-0" aria-hidden />
            ) : null}
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

      <SiteThemeEditorPreview
        groups={groups}
        draftValues={draft}
        labels={labels.preview}
      />

      {groups.map((group) => (
        <SiteThemeEditorGroupCard
          key={group.id}
          group={group}
          labels={groupLabels(labels, group.id)}
          draftValues={draft}
          onChange={setTokenValue}
          onReset={resetToken}
          disabled={pending}
        />
      ))}

      <ConfirmActionModal
        open={resetAllOpen}
        onOpenChange={setResetAllOpen}
        title={labels.resetAllModalTitle}
        description={labels.confirmResetAll}
        cancelLabel={labels.resetAllModalCancel}
        confirmLabel={labels.resetAllModalConfirm}
        confirmVariant="destructive"
        busy={pending}
        onConfirm={() => {
          setResetAllOpen(false);
          runResetAll();
        }}
      />
    </section>
  );
}

function findDefaultValue(
  groups: ReadonlyArray<TokenGroup>,
  key: string,
): string {
  for (const g of groups) {
    const t = g.tokens.find((x) => x.key === key);
    if (t) return t.defaultValue;
  }
  return "";
}

function emptyDraftFromGroups(
  groups: ReadonlyArray<TokenGroup>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of groups) {
    for (const t of g.tokens) out[t.key] = t.defaultValue;
  }
  return out;
}

function isDraftDirty(
  groups: ReadonlyArray<TokenGroup>,
  draft: Record<string, string>,
): boolean {
  for (const g of groups) {
    for (const t of g.tokens) {
      if ((draft[t.key] ?? t.value) !== t.value) return true;
    }
  }
  return false;
}
