"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSiteThemeAction,
  duplicateSiteThemeAction,
  renameSiteThemeAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeActions";
import {
  activateSiteThemeAction,
  archiveSiteThemeAction,
  restoreSiteThemeAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeStateActions";
import type { SiteThemeActionResult } from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import type { SiteThemeRow } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";
import type { ThemePreviewTokens } from "@/lib/cms/themePreviewTokens";
import { SiteThemeTemplatesGrid } from "./SiteThemeTemplatesGrid";
import { SiteThemeTemplatesHeader } from "./siteThemeTemplatesHeader";
import { buildDialogInitialValues, buildDialogLabels } from "./siteThemeDialogPresentation";
import { SiteThemeTemplatesShellAlerts } from "./SiteThemeTemplatesShellAlerts";
import { SiteThemeTemplatesShellDialogs } from "./SiteThemeTemplatesShellDialogs";
import type { SiteThemeRowConfirmState } from "./siteThemeTemplatesShellRowConfirm";
import type { SiteThemeTemplatesShellDialogState } from "./siteThemeTemplatesShellDialogState";

type Labels = Dictionary["admin"]["cms"]["templates"];

export interface SiteThemeTemplatesShellProps {
  locale: string;
  labels: Labels;
  rows: SiteThemeRow[];
  total: number;
  truncated: boolean;
  /** Pre-computed CSS tokens (defaults + overrides) per theme id, used by the
   *  preview cards. Resolved server-side so the client never needs to read
   *  `system.properties`. */
  tokensByThemeId: Readonly<Record<string, ThemePreviewTokens>>;
  /** Brand display name used inside the preview mock copy. */
  brandName: string;
}


export function SiteThemeTemplatesShell({
  locale,
  labels,
  rows,
  total,
  truncated,
  tokensByThemeId,
  brandName,
}: SiteThemeTemplatesShellProps) {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState<SiteThemeTemplatesShellDialogState>({ kind: null });
  const [rowError, setRowError] = useState<string | null>(null);
  const [rowConfirm, setRowConfirm] = useState<SiteThemeRowConfirmState>(null);
  const [pending, startTransition] = useTransition();

  const visibleRows = useMemo(
    () => (showArchived ? rows : rows.filter((r) => !r.archivedAt)),
    [rows, showArchived],
  );
  const existingSlugs = useMemo(
    () => new Set(rows.map((r) => r.slug)),
    [rows],
  );

  function clearDialog() {
    setDialog({ kind: null });
  }

  function applyResult(
    result: SiteThemeActionResult,
    onSuccess: () => void,
    target: "dialog" | "row",
  ) {
    if (result.ok) {
      onSuccess();
      router.refresh();
      return;
    }
    if (target === "dialog") {
      setDialog((prev) => ({ ...prev, errorCode: result.code }));
    } else {
      setRowError(labels.errors[result.code] ?? labels.errors.persist_failed);
    }
  }

  function runRowActionImmediate(fn: () => Promise<SiteThemeActionResult>) {
    setRowError(null);
    startTransition(async () => {
      const result = await fn();
      applyResult(result, () => {}, "row");
    });
  }

  function requestRowConfirm(next: NonNullable<SiteThemeRowConfirmState>) {
    setRowError(null);
    setRowConfirm(next);
  }

  function confirmRowAction() {
    if (!rowConfirm) return;
    const fn = rowConfirm.run;
    setRowConfirm(null);
    setRowError(null);
    startTransition(async () => {
      const result = await fn();
      applyResult(result, () => {}, "row");
    });
  }

  function handleSubmit(input: {
    name: string;
    slug: string;
    activate?: boolean;
  }) {
    const { kind, target } = dialog;
    if (!kind) return;
    startTransition(async () => {
      let result: SiteThemeActionResult;
      if (kind === "create") {
        result = await createSiteThemeAction({
          locale,
          name: input.name,
          slug: input.slug,
          activate: input.activate ?? false,
        });
      } else if (kind === "rename") {
        if (!target) return;
        result = await renameSiteThemeAction({
          locale,
          id: target.id,
          name: input.name,
        });
      } else {
        if (!target) return;
        result = await duplicateSiteThemeAction({
          locale,
          sourceId: target.id,
          name: input.name,
          slug: input.slug,
        });
      }
      applyResult(result, clearDialog, "dialog");
    });
  }

  const dialogLabels = buildDialogLabels(dialog.kind, labels);
  const { initialName, initialSlug } = buildDialogInitialValues(
    dialog.kind,
    dialog.target,
    existingSlugs,
  );

  return (
    <section className="space-y-5">
      <SiteThemeTemplatesHeader
        labels={labels}
        showArchived={showArchived}
        onToggleShowArchived={setShowArchived}
        onCreateClick={() => setDialog({ kind: "create" })}
        pending={pending}
      />

      <SiteThemeTemplatesShellAlerts
        rowError={rowError}
        truncated={truncated}
        rowsLength={rows.length}
        total={total}
        truncatedNotice={labels.truncatedNotice}
      />

      <SiteThemeTemplatesGrid
        locale={locale}
        labels={labels}
        rows={visibleRows}
        tokensByThemeId={tokensByThemeId}
        brandName={brandName}
        pending={pending}
        onActivate={(row) =>
          requestRowConfirm({
            run: () => activateSiteThemeAction({ locale, id: row.id }),
            title: labels.confirmActivateTitle,
            description: labels.confirmActivateBody,
            confirmLabel: labels.activateCta,
          })
        }
        onRename={(row) => setDialog({ kind: "rename", target: row })}
        onDuplicate={(row) => setDialog({ kind: "duplicate", target: row })}
        onArchive={(row) =>
          requestRowConfirm({
            run: () => archiveSiteThemeAction({ locale, id: row.id }),
            title: labels.confirmArchiveTitle,
            description: labels.confirmArchiveBody,
            confirmLabel: labels.archiveCta,
            destructive: true,
          })
        }
        onRestore={(row) =>
          runRowActionImmediate(() => restoreSiteThemeAction({ locale, id: row.id }))
        }
      />

      {visibleRows.length === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {labels.emptyState}
        </p>
      ) : null}

      <SiteThemeTemplatesShellDialogs
        labels={labels}
        dialog={dialog}
        clearDialog={clearDialog}
        dialogLabels={dialogLabels}
        initialName={initialName}
        initialSlug={initialSlug}
        pending={pending}
        onSubmit={handleSubmit}
        rowConfirm={rowConfirm}
        onRowConfirmOpenChange={(o) => {
          if (!o) setRowConfirm(null);
        }}
        onConfirmRowAction={confirmRowAction}
      />
    </section>
  );
}
