"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
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
import type {
  SiteThemeActionErrorCode,
  SiteThemeActionResult,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import type { SiteThemeRow } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";
import { SiteThemeTemplateNameDialog } from "./SiteThemeTemplateNameDialog";
import { SiteThemeTemplatesTable } from "./SiteThemeTemplatesTable";
import {
  buildDialogInitialValues,
  buildDialogLabels,
  type SiteThemeDialogKind,
} from "./siteThemeDialogPresentation";

type Labels = Dictionary["admin"]["cms"]["templates"];

interface DialogState {
  kind: SiteThemeDialogKind;
  target?: SiteThemeRow;
  errorCode?: SiteThemeActionErrorCode | null;
}

export interface SiteThemeTemplatesShellProps {
  locale: string;
  labels: Labels;
  rows: SiteThemeRow[];
  total: number;
  truncated: boolean;
}


export function SiteThemeTemplatesShell({
  locale,
  labels,
  rows,
  total,
  truncated,
}: SiteThemeTemplatesShellProps) {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ kind: null });
  const [rowError, setRowError] = useState<string | null>(null);
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

  function runRowAction(
    fn: () => Promise<SiteThemeActionResult>,
    confirmation?: string,
  ) {
    if (confirmation && !window.confirm(confirmation)) return;
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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
            {labels.title}
          </h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)]">
            {labels.lead}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            {labels.filterShowArchived}
          </label>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setDialog({ kind: "create" })}
            disabled={pending}
          >
            <Plus aria-hidden className="mr-1.5 h-4 w-4" />
            {labels.createCta}
          </Button>
        </div>
      </header>

      {rowError ? (
        <p
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {rowError}
        </p>
      ) : null}

      {truncated ? (
        <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
          {labels.truncatedNotice
            .replace("{{shown}}", String(rows.length))
            .replace("{{total}}", String(total))}
        </p>
      ) : null}

      {visibleRows.length === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {labels.emptyState}
        </p>
      ) : (
        <SiteThemeTemplatesTable
          locale={locale}
          labels={labels}
          rows={visibleRows}
          pending={pending}
          onActivate={(row) =>
            runRowAction(
              () => activateSiteThemeAction({ locale, id: row.id }),
              labels.confirmActivateBody,
            )
          }
          onRename={(row) => setDialog({ kind: "rename", target: row })}
          onDuplicate={(row) => setDialog({ kind: "duplicate", target: row })}
          onArchive={(row) =>
            runRowAction(
              () => archiveSiteThemeAction({ locale, id: row.id }),
              labels.confirmArchiveBody,
            )
          }
          onRestore={(row) =>
            runRowAction(() => restoreSiteThemeAction({ locale, id: row.id }))
          }
        />
      )}

      <SiteThemeTemplateNameDialog
        open={dialog.kind != null}
        onOpenChange={(open) => {
          if (!open) clearDialog();
        }}
        labels={dialogLabels}
        showActivateToggle={dialog.kind === "create"}
        initialName={initialName}
        initialSlug={initialSlug}
        errorMessage={
          dialog.errorCode ? labels.errors[dialog.errorCode] : null
        }
        isSubmitting={pending}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
