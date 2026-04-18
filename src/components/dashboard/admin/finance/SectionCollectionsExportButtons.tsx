"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { exportSectionCollectionsAction } from "@/app/[locale]/dashboard/admin/finance/collections/actions";
import { logClientException } from "@/lib/logging/clientLog";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

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

export interface SectionCollectionsExportButtonsProps {
  locale: string;
  sectionId: string;
  year: number;
  dict: CollectionsDict;
}

export function SectionCollectionsExportButtons({
  locale,
  sectionId,
  year,
  dict,
}: SectionCollectionsExportButtonsProps) {
  const [busy, setBusy] = useState<"csv" | "xlsx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(format: "csv" | "xlsx") {
    setBusy(format);
    setError(null);
    try {
      const res = await exportSectionCollectionsAction({
        locale,
        sectionId,
        year,
        format,
      });
      if (!res.ok) {
        setError(dict.export.exportError);
        return;
      }
      downloadBase64(
        res.artifact.base64,
        res.artifact.mimeType,
        res.artifact.filename,
      );
    } catch (err) {
      logClientException("SectionCollectionsExportButtons:download", err, {
        sectionId,
        format,
      });
      setError(dict.export.exportError);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleDownload("csv")}
          disabled={busy !== null}
          title={dict.export.tipCsv}
          className="inline-flex items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileText className="h-4 w-4" aria-hidden />
          <span>{dict.export.downloadCsv}</span>
          {busy === "csv" ? (
            <Download className="h-3 w-3 animate-pulse" aria-hidden />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => handleDownload("xlsx")}
          disabled={busy !== null}
          title={dict.export.tipXlsx}
          className="inline-flex items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden />
          <span>{dict.export.downloadXlsx}</span>
          {busy === "xlsx" ? (
            <Download className="h-3 w-3 animate-pulse" aria-hidden />
          ) : null}
        </button>
      </div>
      {error ? (
        <span
          role="alert"
          className="text-xs text-[var(--color-error)]"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
