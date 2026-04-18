"use client";

import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  Code2,
  Copy,
  FileCode2,
  LayoutDashboard,
  Palette,
  Pencil,
  Sparkles,
  Star,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { SiteThemeRow } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";
import type { ThemePreviewTokens } from "@/lib/cms/themePreviewTokens";
import {
  SiteThemeTemplatePreviewMock,
  type SiteThemeTemplatePreviewMockLabels,
} from "./SiteThemeTemplatePreviewMock";

type Labels = Dictionary["admin"]["cms"]["templates"];

export interface SiteThemeTemplatePreviewCardProps {
  locale: string;
  labels: Labels;
  row: SiteThemeRow;
  tokens: ThemePreviewTokens;
  pending: boolean;
  brandName: string;
  onActivate: (row: SiteThemeRow) => void;
  onRename: (row: SiteThemeRow) => void;
  onDuplicate: (row: SiteThemeRow) => void;
  onArchive: (row: SiteThemeRow) => void;
  onRestore: (row: SiteThemeRow) => void;
}

function formatUpdated(locale: string, iso: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusLabel(row: SiteThemeRow, labels: Labels): string {
  if (row.archivedAt) return labels.statusArchived;
  if (row.isActive) return labels.statusActive;
  return labels.statusDraft;
}

function buildMockLabels(
  labels: Labels,
  brandName: string,
): SiteThemeTemplatePreviewMockLabels {
  const preview = labels.preview;
  return {
    kicker: preview.kickerSample,
    body: preview.bodySample.replace("{{brand}}", brandName),
    primaryCta: preview.primaryCtaSample,
    secondaryCta: preview.secondaryCtaSample,
    swatchPrimary: preview.swatchPrimary,
    swatchSecondary: preview.swatchSecondary,
    swatchAccent: preview.swatchAccent,
  };
}

export function SiteThemeTemplatePreviewCard({
  locale,
  labels,
  row,
  tokens,
  pending,
  brandName,
  onActivate,
  onRename,
  onDuplicate,
  onArchive,
  onRestore,
}: SiteThemeTemplatePreviewCardProps) {
  const isActive = row.isActive;
  const archived = Boolean(row.archivedAt);
  const isSystemDefault = row.isSystemDefault;
  const wrapperClass = [
    "flex flex-col gap-4 rounded-[var(--layout-border-radius)] border bg-[var(--color-surface)] p-4 transition",
    isActive
      ? "border-2 border-[var(--color-primary)] shadow-[var(--shadow-card)] ring-2 ring-[var(--color-primary)]/15"
      : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-[var(--shadow-soft)]",
    archived ? "opacity-70" : "",
  ].join(" ");

  return (
    <article
      className={wrapperClass}
      aria-label={`${row.name} (${statusLabel(row, labels)})`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {isSystemDefault ? (
            <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <FileCode2 aria-hidden className="h-3 w-3" />
              {labels.preview.defaultBaseLabel}
            </p>
          ) : null}
          <h2 className="truncate text-base font-semibold text-[var(--color-foreground)]">
            {row.name}
          </h2>
          <p className="font-mono text-[11px] text-[var(--color-muted-foreground)]">
            {row.slug}
          </p>
        </div>
        {isActive ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-primary-foreground)] shadow-sm"
            role="status"
            aria-label={labels.preview.activeBadgeAriaLabel}
          >
            <Star aria-hidden className="h-3 w-3 fill-current" />
            {labels.preview.activeBadge}
          </span>
        ) : archived ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-2 py-0.5 text-[11px] text-[var(--color-muted-foreground)]">
            {labels.statusArchived}
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-foreground)]">
            {labels.statusDraft}
          </span>
        )}
      </header>

      <SiteThemeTemplatePreviewMock
        tokens={tokens}
        templateKind={row.templateKind}
        labels={buildMockLabels(labels, brandName)}
      />

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[var(--color-muted-foreground)]">
        <div className="space-y-0.5">
          <dt className="uppercase tracking-wide">{labels.columnKind}</dt>
          <dd className="font-medium text-[var(--color-foreground)]">
            {labels.landing.kindPicker.options[row.templateKind]}
          </dd>
        </div>
        <div className="space-y-0.5 text-right">
          <dt className="uppercase tracking-wide">{labels.columnUpdated}</dt>
          <dd className="text-[var(--color-foreground)]">
            {formatUpdated(locale, row.updatedAt)}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-1.5 border-t border-[var(--color-border)] pt-3">
        {!archived ? (
          <>
            <Link
              href={`/${locale}/dashboard/admin/cms/templates/${row.id}`}
              className="inline-flex items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            >
              <Palette aria-hidden className="mr-1 h-3.5 w-3.5" />
              {labels.openEditorCta}
            </Link>
            <Link
              href={`/${locale}/dashboard/admin/cms/templates/${row.id}/landing`}
              className="inline-flex items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            >
              <LayoutDashboard aria-hidden className="mr-1 h-3.5 w-3.5" />
              {labels.landing.openCta}
            </Link>
            <Link
              href={`/${locale}/dashboard/admin/cms/templates/${row.id}/hero`}
              className="inline-flex items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            >
              <Sparkles aria-hidden className="mr-1 h-3.5 w-3.5" />
              {labels.landing.heroEditor.openCta}
            </Link>
            <Link
              href={`/${locale}/dashboard/admin/cms/templates/${row.id}/properties`}
              className="inline-flex items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            >
              <Code2 aria-hidden className="mr-1 h-3.5 w-3.5" />
              {labels.properties.openCta}
            </Link>
          </>
        ) : null}
        {!isActive && !archived ? (
          <Button
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={() => onActivate(row)}
          >
            <CheckCircle2 aria-hidden className="mr-1 h-4 w-4" />
            {labels.activateCta}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => onRename(row)}
        >
          <Pencil aria-hidden className="mr-1 h-4 w-4" />
          {labels.renameCta}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => onDuplicate(row)}
        >
          <Copy aria-hidden className="mr-1 h-4 w-4" />
          {labels.duplicateCta}
        </Button>
        {archived ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => onRestore(row)}
          >
            <Undo2 aria-hidden className="mr-1 h-4 w-4" />
            {labels.restoreCta}
          </Button>
        ) : !isActive && !isSystemDefault ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => onArchive(row)}
          >
            <Archive aria-hidden className="mr-1 h-4 w-4" />
            {labels.archiveCta}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
