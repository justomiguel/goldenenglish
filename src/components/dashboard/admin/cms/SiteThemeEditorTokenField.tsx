"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { TokenDescriptor, TokenFieldKind } from "@/lib/cms/groupThemeTokens";

export interface SiteThemeEditorTokenFieldLabels {
  resetToDefault: string;
  defaultLabel: string;
  overriddenLabel: string;
}

export interface SiteThemeEditorTokenFieldProps {
  token: TokenDescriptor;
  labels: SiteThemeEditorTokenFieldLabels;
  value: string;
  onChange: (next: string) => void;
  onReset: () => void;
  disabled?: boolean;
}

const inputBase =
  "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40";

function colorInputProps(kind: TokenFieldKind): { type: string } {
  return { type: kind === "color" ? "color" : "text" };
}

/**
 * One token row in the design system editor. Renders a color picker for
 * `color.*` keys, otherwise a text input. Shows a "reset to default" affordance
 * when the current value diverges from the default from `system.properties`.
 */
export function SiteThemeEditorTokenField({
  token,
  labels,
  value,
  onChange,
  onReset,
  disabled = false,
}: SiteThemeEditorTokenFieldProps) {
  const { type } = colorInputProps(token.kind);
  const showReset = value.trim() !== "" && value.trim() !== token.defaultValue;

  return (
    <div className="flex flex-col gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-[var(--color-muted-foreground)]">
            {token.key}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {token.isOverridden
              ? labels.overriddenLabel
              : `${labels.defaultLabel}: ${token.defaultValue || "—"}`}
          </p>
        </div>
        {showReset ? (
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            aria-label={`${labels.resetToDefault} ${token.key}`}
            title={labels.resetToDefault}
            className="inline-flex shrink-0 items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] disabled:opacity-50"
          >
            <RotateCcw aria-hidden className="mr-1 h-3.5 w-3.5" />
            {labels.resetToDefault}
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {token.kind === "color" ? (
          <input
            type="color"
            value={isHexColor(value) ? value : token.defaultValue || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            aria-label={`${token.key} color picker`}
            className="h-9 w-12 cursor-pointer rounded-[var(--layout-border-radius)] border border-[var(--color-border)]"
          />
        ) : null}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          aria-label={token.key}
          className={`${inputBase} flex-1 font-mono`}
        />
      </div>
    </div>
  );
}

function isHexColor(raw: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/u.test(raw.trim());
}

export interface SiteThemeEditorBackLinkProps {
  href: string;
  label: string;
}

export function SiteThemeEditorBackLink({
  href,
  label,
}: SiteThemeEditorBackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
    >
      <ArrowLeft aria-hidden className="mr-1 h-4 w-4" />
      {label}
    </Link>
  );
}
