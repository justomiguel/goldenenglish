"use client";

import type { CSSProperties } from "react";
import type { SiteThemeKind } from "@/types/theming";
import {
  type ThemePreviewTokens,
  themePreviewCssVars,
} from "@/lib/cms/themePreviewTokens";

export interface SiteThemeTemplatePreviewMockLabels {
  kicker: string;
  body: string;
  primaryCta: string;
  secondaryCta: string;
  swatchPrimary: string;
  swatchSecondary: string;
  swatchAccent: string;
}

export interface SiteThemeTemplatePreviewMockProps {
  tokens: ThemePreviewTokens;
  templateKind: SiteThemeKind;
  labels: SiteThemeTemplatePreviewMockLabels;
}

const KIND_HERO_ALIGNMENT: Record<SiteThemeKind, string> = {
  classic: "items-center text-center",
  editorial: "items-start text-left",
  minimal: "items-center text-center",
};

const KIND_HERO_PADDING: Record<SiteThemeKind, string> = {
  classic: "px-4 py-5",
  editorial: "px-4 py-4",
  minimal: "px-4 py-7",
};

const KIND_BODY_FONT: Record<SiteThemeKind, string> = {
  classic: "text-sm font-semibold leading-tight",
  editorial: "text-base font-bold leading-tight tracking-tight",
  minimal: "text-sm font-medium leading-snug",
};

const KIND_KICKER: Record<SiteThemeKind, string> = {
  classic: "text-[10px] uppercase tracking-[0.2em]",
  editorial: "text-[11px] uppercase tracking-[0.3em]",
  minimal: "text-[10px] tracking-[0.15em]",
};

function Swatch({
  color,
  label,
  className,
}: {
  color: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${className ?? ""}`}
      title={label}
    >
      <span
        aria-hidden
        className="block h-4 w-4 rounded-full border border-black/5 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-[8px] uppercase tracking-wide text-[var(--preview-color-muted-foreground)]">
        {label}
      </span>
    </div>
  );
}

export function SiteThemeTemplatePreviewMock({
  tokens,
  templateKind,
  labels,
}: SiteThemeTemplatePreviewMockProps) {
  const surfaceStyle: CSSProperties = {
    ...(themePreviewCssVars(tokens) as CSSProperties),
    backgroundColor: "var(--preview-color-background)",
    color: "var(--preview-color-foreground)",
    borderRadius: "var(--preview-layout-border-radius)",
    borderColor: "var(--preview-color-border)",
  };
  const heroAlign = KIND_HERO_ALIGNMENT[templateKind];
  const heroPadding = KIND_HERO_PADDING[templateKind];
  const bodyFont = KIND_BODY_FONT[templateKind];
  const kickerStyle = KIND_KICKER[templateKind];
  const showSecondaryCta = templateKind !== "minimal";

  return (
    <div
      aria-hidden
      className="relative overflow-hidden border"
      style={surfaceStyle}
    >
      <div
        className="flex items-center gap-1.5 border-b px-3 py-1.5"
        style={{
          backgroundColor: "var(--preview-color-surface)",
          borderColor: "var(--preview-color-border)",
        }}
      >
        <span className="block h-2 w-2 rounded-full bg-[var(--preview-color-secondary)]/60" />
        <span className="block h-2 w-2 rounded-full bg-[var(--preview-color-accent)]/60" />
        <span className="block h-2 w-2 rounded-full bg-[var(--preview-color-primary)]/60" />
        <span className="ml-2 inline-block h-1.5 flex-1 rounded-full bg-[var(--preview-color-muted)]" />
      </div>

      <div className={`flex flex-col gap-2 ${heroAlign} ${heroPadding}`}>
        <span
          className={kickerStyle}
          style={{ color: "var(--preview-color-secondary)" }}
        >
          {labels.kicker}
        </span>
        <span
          className={bodyFont}
          style={{ color: "var(--preview-color-primary)" }}
        >
          {labels.body}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{
              backgroundColor: "var(--preview-color-secondary)",
              color: "var(--preview-color-secondary-foreground)",
              borderRadius: "var(--preview-layout-border-radius)",
            }}
          >
            {labels.primaryCta}
          </span>
          {showSecondaryCta ? (
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium"
              style={{
                color: "var(--preview-color-primary)",
                borderColor: "var(--preview-color-primary)",
                borderRadius: "var(--preview-layout-border-radius)",
              }}
            >
              {labels.secondaryCta}
            </span>
          ) : null}
        </div>
      </div>

      <div
        className="flex items-end justify-around border-t px-3 py-2"
        style={{
          backgroundColor: "var(--preview-color-surface)",
          borderColor: "var(--preview-color-border)",
        }}
      >
        <Swatch color={tokens.colorPrimary} label={labels.swatchPrimary} />
        <Swatch color={tokens.colorSecondary} label={labels.swatchSecondary} />
        <Swatch color={tokens.colorAccent} label={labels.swatchAccent} />
      </div>
    </div>
  );
}
