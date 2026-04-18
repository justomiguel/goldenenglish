"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import type { LandingOverrideLocale } from "@/lib/cms/landingContentCatalog";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeRow } from "@/types/theming";
import { HeroVisualPreviewPane } from "./HeroVisualPreviewPane";
import { LandingCopyFieldEditor } from "./LandingCopyFieldEditor";
import { LandingMediaSlotEditor } from "./LandingMediaSlotEditor";
import {
  buildInitialLandingCopyDraft,
  isLandingCopyDraftDirty,
  type LandingCopyDraft,
} from "./buildLandingCopyDraft";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"];

export interface HeroVisualEditorShellProps {
  locale: string;
  labels: Labels;
  theme: SiteThemeRow;
  section: LandingSectionEditorViewModel;
  brandName: string;
}

export function HeroVisualEditorShell({
  locale,
  labels,
  theme,
  section,
  brandName,
}: HeroVisualEditorShellProps) {
  const router = useRouter();
  const editorLabels = labels.heroEditor;
  const [draft, setDraft] = useState<LandingCopyDraft>(() =>
    buildInitialLandingCopyDraft(section.copy),
  );
  const [previewLocale, setPreviewLocale] =
    useState<LandingOverrideLocale>("es");
  const [errorCode, setErrorCode] = useState<SiteThemeActionErrorCode | null>(
    null,
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = isLandingCopyDraftDirty(section.copy, draft);

  const previewMedia = useMemo(
    () =>
      section.media.map((slot) => ({
        position: slot.position,
        src: slot.currentPublicUrl ?? slot.fallbackPublicUrl,
      })),
    [section.media],
  );

  function updateDraft(key: string, loc: LandingOverrideLocale, value: string) {
    setErrorCode(null);
    setSavedAt(null);
    setDraft((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { es: "", en: "" }), [loc]: value },
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

  function handleReset() {
    if (!window.confirm(labels.confirmResetCopy)) return;
    startTransition(async () => {
      const result = await resetSiteThemeContentAction({
        locale,
        id: theme.id,
        section: section.section,
      });
      applyResult(result, () => {
        const cleared: LandingCopyDraft = {};
        for (const field of section.copy) {
          cleared[field.key] = { es: "", en: "" };
        }
        setDraft(cleared);
        setSavedAt(Date.now());
      });
    });
  }

  return (
    <section className="space-y-6">
      <Link
        href={`/${locale}/dashboard/admin/cms/templates/${theme.id}/landing`}
        className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft aria-hidden className="mr-1 h-4 w-4" />
        {labels.backToOverview}
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
          {editorLabels.title}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)]">
          {editorLabels.lead}
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

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <article className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                {editorLabels.copyTitle}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={handleReset}
                >
                  {labels.resetCopyCta}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={pending || !dirty}
                  isLoading={pending}
                  onClick={handleSave}
                >
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

          <article className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <header className="space-y-1">
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                {editorLabels.mediaTitle}
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {editorLabels.mediaLead}
              </p>
            </header>
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
          </article>
        </div>

        <HeroVisualPreviewPane
          labels={editorLabels}
          fields={section.copy}
          draft={draft}
          brandName={brandName}
          media={previewMedia}
          previewLocale={previewLocale}
          onChangePreviewLocale={setPreviewLocale}
        />
      </div>
    </section>
  );
}
