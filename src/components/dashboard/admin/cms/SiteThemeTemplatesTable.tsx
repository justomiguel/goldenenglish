"use client";

import Link from "next/link";
import { CheckCircle2, Copy, Pencil, Archive, Undo2, Palette, LayoutDashboard, Code2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { SiteThemeRow } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["cms"]["templates"];

export interface SiteThemeTemplatesTableProps {
  locale: string;
  labels: Labels;
  rows: SiteThemeRow[];
  pending: boolean;
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

function statusClassName(row: SiteThemeRow): string {
  if (row.isActive) {
    return "inline-flex items-center gap-1 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]";
  }
  if (row.archivedAt) {
    return "inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]";
  }
  return "inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-foreground)]";
}

export function SiteThemeTemplatesTable({
  locale,
  labels,
  rows,
  pending,
  onActivate,
  onRename,
  onDuplicate,
  onArchive,
  onRestore,
}: SiteThemeTemplatesTableProps) {
  return (
    <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--color-muted)]/40 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          <tr>
            <th className="px-3 py-2">{labels.columnName}</th>
            <th className="px-3 py-2">{labels.columnSlug}</th>
            <th className="px-3 py-2">{labels.columnStatus}</th>
            <th className="px-3 py-2">{labels.columnKind}</th>
            <th className="px-3 py-2">{labels.columnUpdated}</th>
            <th className="px-3 py-2 text-right">{labels.columnActions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2 font-medium text-[var(--color-foreground)]">
                {row.name}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-[var(--color-muted-foreground)]">
                {row.slug}
              </td>
              <td className="px-3 py-2">
                <span className={statusClassName(row)}>
                  {statusLabel(row, labels)}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-[var(--color-foreground)]">
                {labels.landing.kindPicker.options[row.templateKind]}
              </td>
              <td className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                {formatUpdated(locale, row.updatedAt)}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {!row.archivedAt ? (
                    <>
                      <Link
                        href={`/${locale}/dashboard/admin/cms/templates/${row.id}`}
                        className="inline-flex items-center rounded-[var(--layout-border-radius)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                      >
                        <Palette aria-hidden className="mr-1 h-4 w-4" />
                        {labels.openEditorCta}
                      </Link>
                      <Link
                        href={`/${locale}/dashboard/admin/cms/templates/${row.id}/landing`}
                        className="inline-flex items-center rounded-[var(--layout-border-radius)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                      >
                        <LayoutDashboard aria-hidden className="mr-1 h-4 w-4" />
                        {labels.landing.openCta}
                      </Link>
                      <Link
                        href={`/${locale}/dashboard/admin/cms/templates/${row.id}/properties`}
                        className="inline-flex items-center rounded-[var(--layout-border-radius)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                      >
                        <Code2 aria-hidden className="mr-1 h-4 w-4" />
                        {labels.properties.openCta}
                      </Link>
                    </>
                  ) : null}
                  {!row.isActive && !row.archivedAt ? (
                    <Button
                      variant="ghost"
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
                  {row.archivedAt ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => onRestore(row)}
                    >
                      <Undo2 aria-hidden className="mr-1 h-4 w-4" />
                      {labels.restoreCta}
                    </Button>
                  ) : !row.isActive ? (
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
