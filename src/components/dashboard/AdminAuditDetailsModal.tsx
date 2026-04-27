"use client";

import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import type { AdminAuditRow } from "@/types/audit";
import type { Dictionary } from "@/types/i18n";

type AuditLabels = Dictionary["admin"]["audit"];

interface AdminAuditDetailsModalProps {
  row: AdminAuditRow | null;
  labels: AuditLabels;
  onClose: () => void;
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function AdminAuditDetailsModal({
  row,
  labels,
  onClose,
}: AdminAuditDetailsModalProps) {
  return (
    <Modal
      open={row !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      titleId="audit-details-title"
      title={labels.detailsTitle}
      dialogClassName="max-w-4xl"
    >
      {row ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">{row.summary}</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <JsonPanel title={labels.beforeValuesLabel} value={row.beforeValues} />
            <JsonPanel title={labels.afterValuesLabel} value={row.afterValues} />
            <JsonPanel title={labels.diffLabel} value={row.diff} />
            <JsonPanel title={labels.metadataLabel} value={row.metadata} />
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              <X className="h-4 w-4" aria-hidden />
              {labels.closeDetails}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--color-secondary)]">{title}</h3>
      <pre className="max-h-72 overflow-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/35 p-3 text-xs">
        {pretty(value)}
      </pre>
    </section>
  );
}
