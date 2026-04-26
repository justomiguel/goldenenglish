"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  resetSiteThemeContentAction,
  updateSiteThemeContentAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeContentActions";
import type {
  SiteThemeActionErrorCode,
  SiteThemeActionResult,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import type { LandingSectionEditorViewModel } from "@/lib/cms/buildLandingEditorViewModel";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeRow } from "@/types/theming";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { LandingBlocksPanel } from "./LandingBlocksPanel";
import { LandingCopyFieldEditor } from "./LandingCopyFieldEditor";
import { LandingMediaSlotEditor } from "./LandingMediaSlotEditor";
import {
  buildInitialLandingCopyDraft,
  isLandingCopyDraftDirty,
  type LandingCopyDraft,
} from "./buildLandingCopyDraft";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"];

export interface LandingSectionEditorShellProps {
  locale: string;
  labels: Labels;
  theme: SiteThemeRow;
  section: LandingSectionEditorViewModel;
}

export function LandingSectionEditorShell({
  locale,
  labels,
  theme,
  section,
}: LandingSectionEditorShellProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<LandingCopyDraft>(() =>
    buildInitialLandingCopyDraft(section.copy),
  );
  const [errorCode, setErrorCode] = useState<SiteThemeActionErrorCode | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [resetCopyOpen, setResetCopyOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = isLandingCopyDraftDirty(section.copy, draft);

  function updateDraft(key: string, locale: "es" | "en", value: string) {
    setErrorCode(null);
    setSavedAt(null);
    setDraft((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { es: "", en: "" }), [locale]: value },
    }));
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
      const result = await updateSiteThemeContentAction({
        locale,
        id: theme.id,
        section: section.section,
        copy: draft,
      });
      applyResult(result, () => setSavedAt(Date.now()));
    });
  }

  function runResetCopy() {
    startTransition(async () => {
      const result = await resetSiteThemeContentAction({
        locale,
        id: theme.id,
        section: section.section,
      });
      applyResult(result, () => {
        const clear: LandingCopyDraft = {};
        for (const field of section.copy) {
          clear[field.key] = { es: "", en: "" };
        }
        setDraft(clear);
        setSavedAt(Date.now());
      });
    });
  }

  return (
    <section className="space-y-6">
      <Link
        href={`/${locale}/dashboard/admin/cms/templates/${theme.id}/landing`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft aria-hidden className="h-4 w-4 shrink-0" />
        {labels.backToOverview}
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
          {labels.sections[section.section]}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)]">
          {labels.overviewLead}
        </p>
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
          {labels.saveCopySuccess}
        </p>
      ) : null}

      <article className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              {labels.copyTitle}
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {labels.copyLead}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setResetCopyOpen(true)}
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
              {labels.resetCopyCta}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={pending || !dirty}
              isLoading={pending}
              onClick={handleSave}
            >
              {!pending ? (
                <Save className="h-4 w-4 shrink-0" aria-hidden />
              ) : null}
              {labels.saveCopyCta}
            </Button>
          </div>
        </header>
        <div className="space-y-3">
          {section.copy.map((field) => (
            <LandingCopyFieldEditor
              key={field.key}
              field={field}
              labels={labels}
              draftEs={draft[field.key]?.es ?? ""}
              draftEn={draft[field.key]?.en ?? ""}
              onChangeEs={(value) => updateDraft(field.key, "es", value)}
              onChangeEn={(value) => updateDraft(field.key, "en", value)}
              disabled={pending}
            />
          ))}
        </div>
      </article>

      <article className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {labels.mediaTitle}
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {labels.mediaLead}
          </p>
        </header>
        {section.media.length === 0 ? (
          <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-sm text-[var(--color-muted-foreground)]">
            {labels.mediaEmpty}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {section.media.map((slot) => (
              <LandingMediaSlotEditor
                key={slot.position}
                locale={locale}
                themeId={theme.id}
                section={section.section}
                slot={slot}
                labels={labels}
                onChanged={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </article>

      <LandingBlocksPanel
        locale={locale}
        themeId={theme.id}
        section={section.section}
        blocks={section.blocks}
        labels={labels.blocks}
      />

      <ConfirmActionModal
        open={resetCopyOpen}
        onOpenChange={setResetCopyOpen}
        title={labels.resetCopyModalTitle}
        description={labels.confirmResetCopy}
        cancelLabel={labels.resetCopyModalCancel}
        confirmLabel={labels.resetCopyModalConfirm}
        busy={pending}
        onConfirm={() => {
          setResetCopyOpen(false);
          runResetCopy();
        }}
      />
    </section>
  );
}
