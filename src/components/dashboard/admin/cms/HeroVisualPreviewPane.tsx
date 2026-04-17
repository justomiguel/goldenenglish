"use client";

import type { LandingCopyFieldDescriptor } from "@/lib/cms/buildLandingEditorViewModel";
import type { LandingOverrideLocale } from "@/lib/cms/landingContentCatalog";
import type { Dictionary } from "@/types/i18n";
import { HeroLivePreview, type HeroPreviewMedia } from "./HeroLivePreview";
import type { LandingCopyDraft } from "./buildLandingCopyDraft";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"]["heroEditor"];

export interface HeroVisualPreviewPaneProps {
  labels: Labels;
  fields: ReadonlyArray<LandingCopyFieldDescriptor>;
  draft: LandingCopyDraft;
  brandName: string;
  media: ReadonlyArray<HeroPreviewMedia>;
  previewLocale: LandingOverrideLocale;
  onChangePreviewLocale: (locale: LandingOverrideLocale) => void;
}

const LOCALES: ReadonlyArray<LandingOverrideLocale> = ["es", "en"];

export function HeroVisualPreviewPane({
  labels,
  fields,
  draft,
  brandName,
  media,
  previewLocale,
  onChangePreviewLocale,
}: HeroVisualPreviewPaneProps) {
  return (
    <div>
      <div className="mb-2 flex justify-end gap-1">
        {LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => onChangePreviewLocale(loc)}
            aria-pressed={previewLocale === loc}
            className={[
              "rounded-[var(--layout-border-radius)] border px-2 py-1 text-xs font-semibold uppercase tracking-wide",
              previewLocale === loc
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)]",
            ].join(" ")}
          >
            {loc}
          </button>
        ))}
      </div>
      <HeroLivePreview
        labels={labels}
        fields={fields}
        draft={draft}
        locale={previewLocale}
        brandName={brandName}
        media={media}
      />
    </div>
  );
}
