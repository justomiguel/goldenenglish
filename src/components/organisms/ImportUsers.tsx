"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { InfoNoticeModal } from "@/components/molecules/InfoNoticeModal";
import {
  applyImportUsersAction,
  dryRunImportUsersAction,
  type DryRunImportUsersResult,
} from "@/app/[locale]/dashboard/admin/users/importUsersActions";
import { logClientException } from "@/lib/logging/clientLog";
import type { Dictionary } from "@/types/i18n";

type SpreadsheetLabels = Dictionary["admin"]["users"]["spreadsheet"];

function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  let out = template;
  for (const [k, v] of Object.entries(values)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

export interface ImportUsersProps {
  locale: string;
  labels: SpreadsheetLabels;
}

export function ImportUsers({ locale, labels }: ImportUsersProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Extract<DryRunImportUsersResult, { ok: true }> | null>(
    null,
  );
  const [updateDuplicates, setUpdateDuplicates] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultBody, setResultBody] = useState("");

  async function onFile(file: File | null) {
    setError(null);
    setPreview(null);
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await dryRunImportUsersAction(locale, fd);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setPreview(res);
      setUpdateDuplicates(false);
    } catch (err) {
      logClientException("ImportUsers:dryRun", err);
      setError(labels.errorParseFailed);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onConfirmApply() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const res = await applyImportUsersAction({
        locale,
        updateDuplicates,
        newRows: preview.payload.newRows,
        duplicateRows: preview.payload.duplicateRows.map((d) => ({
          existingId: d.existingId,
          row: d.row,
        })),
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setPreview(null);
      setResultBody(
        fill(labels.resultBody, {
          created: res.created,
          updated: res.updated,
          skipped: res.skipped,
          failed: res.failed,
        }),
      );
      setResultOpen(true);
      router.refresh();
    } catch (err) {
      logClientException("ImportUsers:apply", err);
      setError(labels.errorApplyFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)]">{labels.importLead}</p>

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        aria-label={labels.chooseFileAria}
        onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
      />

      <Button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        aria-label={labels.chooseFileAria}
      >
        <FileUp className="h-4 w-4" aria-hidden />
        {busy ? labels.busyDryRun : labels.chooseFile}
      </Button>

      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}

      <ConfirmActionModal
        open={preview != null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        title={labels.previewTitle}
        body={
          preview
            ? fill(labels.previewBody, {
                newCount: preview.newCount,
                duplicateCount: preview.duplicateCount,
                invalidCount: preview.invalidCount,
              })
            : undefined
        }
        formSlot={
          preview && preview.duplicateCount > 0 ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{labels.updateDuplicatesLabel}</legend>
              <label className="flex min-h-[44px] items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="update-dup"
                  className="mt-1"
                  checked={!updateDuplicates}
                  onChange={() => setUpdateDuplicates(false)}
                />
                <span>{labels.updateDuplicatesNo}</span>
              </label>
              <label className="flex min-h-[44px] items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="update-dup"
                  className="mt-1"
                  checked={updateDuplicates}
                  onChange={() => setUpdateDuplicates(true)}
                />
                <span>{labels.updateDuplicatesYes}</span>
              </label>
            </fieldset>
          ) : null
        }
        cancelLabel={labels.cancel}
        confirmLabel={busy ? labels.busyApply : labels.confirmApply}
        confirmDisabled={busy || (preview?.newCount === 0 && !updateDuplicates)}
        busy={busy}
        onConfirm={() => void onConfirmApply()}
      />

      <InfoNoticeModal
        open={resultOpen}
        onOpenChange={setResultOpen}
        title={labels.resultTitle}
        message={resultBody}
        closeLabel={labels.resultClose}
      />
    </div>
  );
}
