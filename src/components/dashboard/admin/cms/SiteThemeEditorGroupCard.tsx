"use client";

import type { TokenGroup } from "@/lib/cms/groupThemeTokens";
import {
  SiteThemeEditorTokenField,
  type SiteThemeEditorTokenFieldLabels,
} from "./SiteThemeEditorTokenField";

export interface SiteThemeEditorGroupCardLabels
  extends SiteThemeEditorTokenFieldLabels {
  /** Friendly title per group ("Colors", "Layout", …). */
  title: string;
  /** One-liner description shown below the title. */
  description: string;
}

export interface SiteThemeEditorGroupCardProps {
  group: TokenGroup;
  labels: SiteThemeEditorGroupCardLabels;
  draftValues: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: (key: string) => void;
  disabled?: boolean;
}

/**
 * One section of the editor (one prefix: color, layout, shadow, …). Stays a
 * thin wrapper so the shell can compose multiple groups without growing past
 * the architecture line limit.
 */
export function SiteThemeEditorGroupCard({
  group,
  labels,
  draftValues,
  onChange,
  onReset,
  disabled,
}: SiteThemeEditorGroupCardProps) {
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
      <div className="grid gap-2 md:grid-cols-2">
        {group.tokens.map((token) => (
          <SiteThemeEditorTokenField
            key={token.key}
            token={token}
            labels={labels}
            value={draftValues[token.key] ?? token.value}
            onChange={(next) => onChange(token.key, next)}
            onReset={() => onReset(token.key)}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  );
}
