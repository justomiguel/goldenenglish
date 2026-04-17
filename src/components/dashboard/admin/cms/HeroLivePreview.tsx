"use client";

import Image from "next/image";
import type { LandingCopyFieldDescriptor } from "@/lib/cms/buildLandingEditorViewModel";
import type { LandingOverrideLocale } from "@/lib/cms/landingContentCatalog";
import type { Dictionary } from "@/types/i18n";
import type { LandingCopyDraft } from "./buildLandingCopyDraft";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"]["heroEditor"];

export interface HeroPreviewMedia {
  position: number;
  src: string | null;
}

export interface HeroLivePreviewProps {
  labels: Labels;
  fields: ReadonlyArray<LandingCopyFieldDescriptor>;
  draft: LandingCopyDraft;
  locale: LandingOverrideLocale;
  brandName: string;
  media: ReadonlyArray<HeroPreviewMedia>;
}

function copy(
  fields: ReadonlyArray<LandingCopyFieldDescriptor>,
  draft: LandingCopyDraft,
  locale: LandingOverrideLocale,
  key: string,
): string {
  const draftValue = draft[key]?.[locale]?.trim();
  if (draftValue) return draftValue;
  const field = fields.find((f) => f.key === key);
  return field?.defaults[locale] ?? "";
}

/**
 * Lightweight, presentational mock of the Hero. Mirrors the live structure
 * (kicker, brand title, CTAs, image collage) but uses tokens directly so it
 * stays in sync with `system.properties` without re-rendering the full
 * organism. Updates as the admin types in the editor.
 */
export function HeroLivePreview({
  labels,
  fields,
  draft,
  locale,
  brandName,
  media,
}: HeroLivePreviewProps) {
  const kicker = copy(fields, draft, locale, "hero.kicker");
  const ctaRegister = copy(fields, draft, locale, "hero.ctaRegister");
  const ctaSignedIn = copy(fields, draft, locale, "hero.ctaSignedIn");
  const ctaWhatsapp = copy(fields, draft, locale, "hero.whatsappCta");

  return (
    <aside
      aria-label={labels.previewTitle}
      className="sticky top-6 space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {labels.previewTitle}
        </h2>
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-0.5 text-xs uppercase text-[var(--color-muted-foreground)]">
          {locale}
        </span>
      </header>
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-5">
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            {kicker}
          </p>
        ) : null}
        <h3 className="mt-2 text-2xl font-bold text-[var(--color-secondary)]">
          {brandName}
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {ctaRegister ? (
            <span className="inline-flex items-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-foreground)]">
              {ctaRegister}
            </span>
          ) : null}
          {ctaSignedIn ? (
            <span className="inline-flex items-center rounded-[var(--layout-border-radius)] border border-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">
              {ctaSignedIn}
            </span>
          ) : null}
          {ctaWhatsapp ? (
            <span className="inline-flex items-center rounded-[var(--layout-border-radius)] border border-[var(--color-secondary)] bg-[var(--color-secondary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-secondary)]">
              {ctaWhatsapp}
            </span>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {media.map((item) => (
          <div
            key={item.position}
            className="relative aspect-square overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]"
          >
            {item.src ? (
              <Image
                src={item.src}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-full items-center justify-center text-[10px] font-semibold uppercase text-[var(--color-muted-foreground)]">
                {labels.slotPlaceholder.replace(
                  "{{position}}",
                  String(item.position),
                )}
              </span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
