"use client";

import { useId, useState } from "react";
import { Download, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { exportUsersAction } from "@/app/[locale]/dashboard/admin/users/exportUsersAction";
import type { UsersExportFallback, UsersExportMode } from "@/lib/users/resolveUsersExportScope";
import { logClientException } from "@/lib/logging/clientLog";
import type { Dictionary } from "@/types/i18n";

type SpreadsheetLabels = Dictionary["admin"]["users"]["spreadsheet"];

function downloadBase64(base64: string, mime: string, filename: string) {
  const byteString = atob(base64);
  const len = byteString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) bytes[i] = byteString.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function tpl(template: string, count: number): string {
  return template.replace(/\{\{count\}\}/g, String(count));
}

export interface AdminUsersExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  labels: SpreadsheetLabels;
  selectedIds: string[];
  searchQuery: string;
  roleFilter: string;
}

export function AdminUsersExportModal({
  open,
  onOpenChange,
  locale,
  labels,
  selectedIds,
  searchQuery,
  roleFilter,
}: AdminUsersExportModalProps) {
  const titleId = useId();
  const [mode, setMode] = useState<UsersExportMode>("data");
  const [fallback, setFallback] = useState<UsersExportFallback>("filter");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSelection = selectedIds.length > 0;

  async function onDownload() {
    setBusy(true);
    setError(null);
    try {
      const res = await exportUsersAction({
        locale,
        mode,
        selectedIds,
        fallback,
        q: searchQuery,
        role: roleFilter,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      downloadBase64(res.artifact.base64, res.artifact.mimeType, res.artifact.filename);
      onOpenChange(false);
    } catch (err) {
      logClientException("AdminUsersExportModal:download", err);
      setError(labels.errorExportFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} titleId={titleId} title={labels.exportTitle}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.exportLead}</p>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--color-foreground)]">
            {labels.modeLabel}
          </legend>
          <label className="flex min-h-[44px] items-center gap-2 text-sm">
            <input
              type="radio"
              name="export-mode"
              checked={mode === "template"}
              onChange={() => setMode("template")}
            />
            {labels.modeTemplate}
          </label>
          <label className="flex min-h-[44px] items-center gap-2 text-sm">
            <input
              type="radio"
              name="export-mode"
              checked={mode === "data"}
              onChange={() => setMode("data")}
            />
            {labels.modeData}
          </label>
        </fieldset>

        {mode === "data" && hasSelection ? (
          <p className="text-sm text-[var(--color-foreground)]">
            {tpl(labels.scopeSelectedHint, selectedIds.length)}
          </p>
        ) : null}

        {mode === "data" && !hasSelection ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--color-foreground)]">
              {labels.scopeLabel}
            </legend>
            <label className="flex min-h-[44px] items-center gap-2 text-sm">
              <input
                type="radio"
                name="export-scope"
                checked={fallback === "filter"}
                onChange={() => setFallback("filter")}
              />
              {labels.scopeFilter}
            </label>
            <label className="flex min-h-[44px] items-center gap-2 text-sm">
              <input
                type="radio"
                name="export-scope"
                checked={fallback === "all"}
                onChange={() => setFallback("all")}
              />
              {labels.scopeAll}
            </label>
          </fieldset>
        ) : null}

        {error ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            <X className="h-4 w-4" aria-hidden />
            {labels.cancel}
          </Button>
          <Button type="button" onClick={() => void onDownload()} disabled={busy} isLoading={busy}>
            <Download className="h-4 w-4" aria-hidden />
            {labels.download}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AdminUsersExportTrigger({
  labels,
  onClick,
}: {
  labels: SpreadsheetLabels;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="secondary" onClick={onClick} aria-label={labels.exportUsersAria}>
      <Download className="h-4 w-4" aria-hidden />
      {labels.exportUsers}
    </Button>
  );
}
