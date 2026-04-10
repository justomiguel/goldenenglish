"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { mapCsvRecords } from "@/lib/import/studentCsvMap";
import { bulkImportStudentsFromRows } from "@/app/[locale]/dashboard/admin/import/actions";
import { csvStudentRowsSchema } from "@/lib/import/studentRowSchema";

interface ImportStudentsProps {
  labels: Dictionary["admin"]["import"];
}

export function ImportStudents({ labels }: ImportStudentsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const onFile = useCallback(
    async (file: File | null) => {
      setSummary(null);
      setDetail(null);
      if (!file) return;

      setBusy(true);
      try {
        const text = await file.text();
        const parsed = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        });

        if (parsed.errors.length > 0) {
          setSummary(labels.parseError);
          setDetail(parsed.errors.map((e) => e.message).join("\n"));
          return;
        }

        const mapped = mapCsvRecords(parsed.data);
        if (mapped.length === 0) {
          setSummary(labels.noRows);
          return;
        }

        const checked = csvStudentRowsSchema.safeParse(mapped);
        if (!checked.success) {
          setSummary(labels.validationError);
          setDetail(JSON.stringify(checked.error.flatten(), null, 2));
          return;
        }

        const result = await bulkImportStudentsFromRows(checked.data);
        const failed = result.results.filter((r) => !r.ok);
        setSummary(
          `${labels.done}: ${result.processed} ${labels.rows}, +${result.createdUsers} ${labels.users}, +${result.enrolled} ${labels.enrollments}, +${result.paymentsSeeded} ${labels.paymentSlots}`,
        );
        if (failed.length > 0) {
          setDetail(
            failed.map((f) => `${labels.row} ${f.rowIndex}: ${f.message}`).join("\n"),
          );
        }
      } catch (e) {
        setSummary(labels.genericError);
        setDetail(e instanceof Error ? e.message : "Error");
      } finally {
        setBusy(false);
      }
    },
    [labels],
  );

  return (
    <div className="max-w-xl space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6">
      <h2 className="text-lg font-semibold text-[var(--color-secondary)]">
        {labels.title}
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.hint}
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        disabled={busy}
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        isLoading={busy}
        onClick={() => fileRef.current?.click()}
      >
        {busy ? labels.processing : labels.chooseFile}
      </Button>
      {summary ? (
        <p className="text-sm text-[var(--color-foreground)]" role="status">
          {summary}
        </p>
      ) : null}
      {detail ? (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-xs text-[var(--color-error)]">
          {detail}
        </pre>
      ) : null}
    </div>
  );
}
