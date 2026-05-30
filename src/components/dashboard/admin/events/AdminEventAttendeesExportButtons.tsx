"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { exportEventAttendeesAction } from "@/app/[locale]/dashboard/admin/events/exportAttendeesAction";
import { logClientException } from "@/lib/logging/clientLog";

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

export interface AdminEventAttendeesExportLabels {
  downloadXlsx: string;
  downloadPdf: string;
  tipXlsx: string;
  tipPdf: string;
  exportError: string;
}

interface AdminEventAttendeesExportButtonsProps {
  locale: string;
  eventId: string;
  labels: AdminEventAttendeesExportLabels;
  disabled?: boolean;
}

export function AdminEventAttendeesExportButtons({
  locale,
  eventId,
  labels,
  disabled = false,
}: AdminEventAttendeesExportButtonsProps) {
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(format: "xlsx" | "pdf") {
    setBusy(format);
    setError(null);
    try {
      const res = await exportEventAttendeesAction({ locale, eventId, format });
      if (!res.ok) {
        setError(res.message === "validation" ? labels.exportError : res.message);
        return;
      }
      downloadBase64(res.artifact.base64, res.artifact.mimeType, res.artifact.filename);
    } catch (err) {
      logClientException("AdminEventAttendeesExportButtons:download", err, { eventId, format });
      setError(labels.exportError);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleDownload("xlsx")}
          disabled={disabled || busy !== null}
          title={labels.tipXlsx}
          className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden />
          <span>{labels.downloadXlsx}</span>
          {busy === "xlsx" ? <Download className="h-3 w-3 animate-pulse" aria-hidden /> : null}
        </button>
        <button
          type="button"
          onClick={() => handleDownload("pdf")}
          disabled={disabled || busy !== null}
          title={labels.tipPdf}
          className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileText className="h-4 w-4" aria-hidden />
          <span>{labels.downloadPdf}</span>
          {busy === "pdf" ? <Download className="h-3 w-3 animate-pulse" aria-hidden /> : null}
        </button>
      </div>
      {error ? (
        <span role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}
