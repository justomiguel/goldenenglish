"use client";

import type { TokenGroup } from "@/lib/cms/groupThemeTokens";

export interface SiteThemeEditorPreviewLabels {
  title: string;
  description: string;
  primarySwatch: string;
  secondarySwatch: string;
  accentSwatch: string;
  surfaceSwatch: string;
  foregroundSwatch: string;
}

export interface SiteThemeEditorPreviewProps {
  groups: ReadonlyArray<TokenGroup>;
  draftValues: Record<string, string>;
  labels: SiteThemeEditorPreviewLabels;
}

interface SwatchSpec {
  key: string;
  textKey: string | null;
  label: string;
}

function valueFor(
  groups: ReadonlyArray<TokenGroup>,
  draft: Record<string, string>,
  key: string,
): string {
  if (draft[key] != null && draft[key].trim() !== "") return draft[key];
  for (const g of groups) {
    const t = g.tokens.find((x) => x.key === key);
    if (t) return t.value;
  }
  return "";
}

/**
 * Live preview of the most representative tokens in the design system. Reads
 * straight from the in-memory draft so admins see edits before saving, without
 * having to refresh the public site.
 */
export function SiteThemeEditorPreview({
  groups,
  draftValues,
  labels,
}: SiteThemeEditorPreviewProps) {
  const swatches: ReadonlyArray<SwatchSpec> = [
    {
      key: "color.primary",
      textKey: "color.primary.foreground",
      label: labels.primarySwatch,
    },
    {
      key: "color.secondary",
      textKey: "color.secondary.foreground",
      label: labels.secondarySwatch,
    },
    {
      key: "color.accent",
      textKey: "color.accent.foreground",
      label: labels.accentSwatch,
    },
    {
      key: "color.surface",
      textKey: "color.foreground",
      label: labels.surfaceSwatch,
    },
    {
      key: "color.background",
      textKey: "color.foreground",
      label: labels.foregroundSwatch,
    },
  ];

  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-[var(--color-secondary)]">
          {labels.title}
        </h2>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {labels.description}
        </p>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {swatches.map((s) => {
          const bg = valueFor(groups, draftValues, s.key);
          const fg = s.textKey
            ? valueFor(groups, draftValues, s.textKey)
            : "#ffffff";
          return (
            <li
              key={s.key}
              className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-3 text-xs"
              style={{ backgroundColor: bg || "transparent", color: fg }}
            >
              <p className="font-semibold">{s.label}</p>
              <p className="font-mono opacity-80">{bg || "—"}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
