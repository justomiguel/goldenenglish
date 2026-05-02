"use client";

import { ImageUp, Upload } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { useSiteThemeBrandAssetUploads } from "@/hooks/useSiteThemeBrandAssetUploads";
import { siteThemeBrandStoragePreviewUrl } from "@/lib/client/siteThemeBrandStoragePreviewUrl";
import type { SiteThemeActionErrorCode } from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import type { Dictionary } from "@/types/i18n";

type BrandLabels = Dictionary["admin"]["cms"]["templates"]["editor"]["brandAssets"];
type EditorErrors = Dictionary["admin"]["cms"]["templates"]["editor"]["errors"];

export interface SiteThemeBrandAssetsPanelProps {
  locale: string;
  themeId: string;
  labels: BrandLabels;
  errorLabels: EditorErrors;
  logoPathDraft: string;
  faviconPathDraft: string;
  bundlePrefixDraft: string;
  logoAltDraft: string;
  onAssetsUpdated: (
    applied: Record<string, string>,
    cleared: string[],
  ) => void;
}

export function SiteThemeBrandAssetsPanel({
  locale,
  themeId,
  labels,
  errorLabels,
  logoPathDraft,
  faviconPathDraft,
  bundlePrefixDraft,
  logoAltDraft,
  onAssetsUpdated,
}: SiteThemeBrandAssetsPanelProps) {
  const {
    logoInputId,
    favInputId,
    logoFileRef,
    favFileRef,
    altInput,
    setAltInput,
    errorCode,
    logoOk,
    favOk,
    pending,
    uploadUi,
    handleLogoPickClick,
    handleFaviconPickClick,
    handleLogoFile,
    handleFaviconFile,
  } = useSiteThemeBrandAssetUploads({
    locale,
    themeId,
    logoAltDraft,
    onAssetsUpdated,
  });

  const logoPublic = siteThemeBrandStoragePreviewUrl(logoPathDraft);
  const favPublic = siteThemeBrandStoragePreviewUrl(faviconPathDraft);

  function resolveError(code: SiteThemeActionErrorCode): string {
    return (
      errorLabels[code as keyof typeof errorLabels] ??
      errorLabels.persist_failed
    );
  }

  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-secondary)]">
          {labels.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {labels.lead}
        </p>
      </div>

      {uploadUi.kind === "busy" ? (
        <InlineUploadProgressBar
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-3"
          label={
            uploadUi.stage === "reading"
              ? labels.uploadProgressReading
              : labels.uploadProgressSending
          }
          {...(uploadUi.stage === "reading"
            ? { value: uploadUi.readPercent, indeterminate: false }
            : { indeterminate: true })}
        />
      ) : null}

      {errorCode ? (
        <p
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {resolveError(errorCode)}
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor={logoInputId}>{labels.logoLabel}</Label>
          <div className="flex flex-wrap items-start gap-3">
            {logoPublic ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage URLs may be outside image remotePatterns
              <img
                src={logoPublic}
                alt=""
                className="h-16 w-auto max-w-[140px] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] object-contain p-1"
              />
            ) : (
              <div className="flex h-16 w-28 items-center justify-center rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)]">
                {labels.noPreview}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <input
                ref={logoFileRef}
                id={logoInputId}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) =>
                  void handleLogoFile(e.target.files?.[0] ?? null)
                }
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={handleLogoPickClick}
                className="min-h-[44px]"
              >
                <Upload className="h-4 w-4 shrink-0" aria-hidden />
                {labels.logoPick}
              </Button>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {labels.logoHint}
              </p>
            </div>
          </div>
          <div>
            <Label htmlFor={`${logoInputId}-alt`}>{labels.logoAltLabel}</Label>
            <Input
              id={`${logoInputId}-alt`}
              value={altInput}
              onChange={(e) => setAltInput(e.target.value)}
              disabled={pending}
              className="mt-1"
              maxLength={200}
            />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {labels.logoAltHint}
            </p>
          </div>
          {logoOk && !errorCode ? (
            <p role="status" className="text-sm text-[var(--color-success)]">
              {labels.logoSuccess}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <Label htmlFor={favInputId}>{labels.faviconLabel}</Label>
          <div className="flex flex-wrap items-start gap-3">
            {favPublic && faviconPathDraft.trim().length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage / CDN URLs
              <img
                src={favPublic}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] object-contain"
              />
            ) : (
              <div className="flex h-16 w-28 items-center justify-center rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-muted-foreground)]">
                {bundlePrefixDraft.trim()
                  ? labels.bundlePreview
                  : labels.noPreview}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <input
                ref={favFileRef}
                id={favInputId}
                type="file"
                accept="image/png,image/jpeg,image/webp,.ico,.zip,application/zip,application/x-zip-compressed"
                className="sr-only"
                onChange={(e) =>
                  void handleFaviconFile(e.target.files?.[0] ?? null)
                }
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={handleFaviconPickClick}
                className="min-h-[44px]"
              >
                <ImageUp className="h-4 w-4 shrink-0" aria-hidden />
                {labels.faviconPick}
              </Button>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {labels.faviconHint}
              </p>
            </div>
          </div>
          <p className="break-all font-mono text-xs text-[var(--color-muted-foreground)]">
            <span className="font-sans font-medium text-[var(--color-foreground)]">
              {labels.currentPath}
            </span>{" "}
            {faviconPathDraft.trim() || "—"}
          </p>
          {favOk && !errorCode ? (
            <p role="status" className="text-sm text-[var(--color-success)]">
              {labels.faviconSuccess}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
