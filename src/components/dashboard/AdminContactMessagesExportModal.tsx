"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { exportContactMessagesAction } from "@/app/[locale]/dashboard/admin/messages/exportContactMessagesAction";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { logClientException } from "@/lib/logging/clientLog";
import {
  CONTACT_MESSAGE_EXPORT_FIELD_ORDER,
  orderContactMessageExportFields,
  type ContactMessageExportField,
  type ContactMessageExportScope,
} from "@/lib/messaging/export/contactMessageExportContract";
import type { Dictionary } from "@/types/i18n";

type ExportLabels = Dictionary["admin"]["messages"]["contactExport"];

const FIELD_LABEL: Record<ContactMessageExportField, keyof ExportLabels> = {
  sentAt: "fieldSentAt",
  name: "fieldName",
  email: "fieldEmail",
  phone: "fieldPhone",
  subject: "fieldSubject",
  body: "fieldBody",
};

function downloadBase64(base64: string, mime: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function AdminContactMessagesExportModal(props: {
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: ExportLabels;
}) {
  const [scope, setScope] = useState<ContactMessageExportScope>("all");
  const [fields, setFields] = useState<ContactMessageExportField[]>([
    ...CONTACT_MESSAGE_EXPORT_FIELD_ORDER,
  ]);
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleField(field: ContactMessageExportField) {
    setFields((current) => {
      if (current.includes(field)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== field);
      }
      return orderContactMessageExportFields([...current, field]);
    });
  }

  async function download(format: "xlsx" | "pdf") {
    setBusy(format);
    setError(null);
    try {
      const result = await exportContactMessagesAction({
        locale: props.locale,
        format,
        scope,
        fields,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      downloadBase64(result.artifact.base64, result.artifact.mimeType, result.artifact.filename);
    } catch (err) {
      logClientException("AdminContactMessagesExportModal:download", err, { format, scope });
      setError(props.labels.exportError);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal
      open={props.open}
      onOpenChange={props.onOpenChange}
      titleId="contact-messages-export-title"
      title={props.labels.modalTitle}
      disableClose={busy !== null}
    >
      <p className="text-sm text-[var(--color-muted-foreground)]">{props.labels.modalLead}</p>
      <fieldset className="mt-4 space-y-2" disabled={busy !== null}>
        <legend className="text-sm font-medium text-[var(--color-foreground)]">{props.labels.scopeLegend}</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="radio"
            name="contact-export-scope"
            checked={scope === "all"}
            onChange={() => setScope("all")}
          />
          {props.labels.scopeAll}
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="radio"
            name="contact-export-scope"
            checked={scope === "latest_2000"}
            onChange={() => setScope("latest_2000")}
          />
          {props.labels.scopeLatest}
        </label>
      </fieldset>
      <fieldset className="mt-4 grid gap-1 sm:grid-cols-2" disabled={busy !== null}>
        <legend className="sr-only">{props.labels.modalTitle}</legend>
        {CONTACT_MESSAGE_EXPORT_FIELD_ORDER.map((field) => (
          <label key={field} className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fields.includes(field)}
              onChange={() => toggleField(field)}
            />
            {props.labels[FIELD_LABEL[field]]}
          </label>
        ))}
      </fieldset>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="ghost" className="min-h-11 border border-[var(--color-border)]" disabled={busy !== null} onClick={() => download("xlsx")}>
          <FileSpreadsheet className="h-4 w-4" aria-hidden />
          {props.labels.downloadXlsx}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11 border border-[var(--color-border)]" disabled={busy !== null} onClick={() => download("pdf")}>
          <FileText className="h-4 w-4" aria-hidden />
          {props.labels.downloadPdf}
        </Button>
      </div>
    </Modal>
  );
}
