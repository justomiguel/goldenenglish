"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import type { LongJobSnapshot } from "@/types/longJob";
import { Button } from "@/components/atoms/Button";
import { LongJobActivityModal } from "@/components/molecules/LongJobActivityModal";
import { LongJobLoader } from "@/components/molecules/LongJobLoader";
import { buildImportActivityModalCopy } from "@/lib/import/buildImportActivityModalCopy";
import { formatImportJobActivityLog } from "@/lib/import/resolveImportJobActivityLine";
import { mapCsvRecords } from "@/lib/import/studentCsvMap";
import { parseImportFile } from "@/lib/import/parseImportFile";
import { bulkImportStudentsFromRows } from "@/app/[locale]/dashboard/admin/import/actions";
import { csvStudentRowsSchema } from "@/lib/import/studentRowSchema";
import type { BulkImportResult } from "@/lib/import/bulkImportStudents";
import {
  formatImportDoneSummary,
  resolveImportSurfaceMessage,
  resolveParseErrorOrUnknown,
} from "@/lib/import/importStudentsMessages";
import { IMPORT_JOB_CANCELLED_BY_USER } from "@/lib/import/importJobErrorCodes";
import type { ImportJobActivityEntry } from "@/types/importJob";
import { useLongJobPoll } from "@/hooks/useLongJobPoll";
import { useImportJobCancel } from "@/hooks/useImportJobCancel";
interface ImportStudentsProps {
  locale: string;
  labels: Dictionary["admin"]["import"];
  emptyLogPlaceholder: string;
}

export function ImportStudents({ locale, labels, emptyLogPlaceholder }: ImportStudentsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [phaseLine, setPhaseLine] = useState<string | null>(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [logModalLive, setLogModalLive] = useState(false);
  const [importTotalRows, setImportTotalRows] = useState<number | null>(null);
  const { liveLine, jobSnapshot, reset, pollUntilDone } = useLongJobPoll();
  const { jobId, setJobId, cancelBusy, cancelImport, resetCancelState } = useImportJobCancel({
    genericError: labels.genericError,
    cancelError: labels.importCancelError,
    setSummary,
    setDetail,
  });
  const activityLines = useMemo(() => {
    const act = (jobSnapshot as { activity?: ImportJobActivityEntry[] } | null)?.activity;
    return formatImportJobActivityLog(act, labels);
  }, [jobSnapshot, labels]);
  const activityModalCopy = useMemo(
    () =>
      buildImportActivityModalCopy({
        labels,
        jobSnapshot,
        importTotalRows,
        logModalLive,
      }),
    [importTotalRows, jobSnapshot, labels, logModalLive],
  );

  const onFile = useCallback(
    async (file: File | null) => {
      setSummary(null);
      setDetail(null);
      reset();
      setJobModalOpen(false);
      setLogModalLive(false);
      resetCancelState();
      setImportTotalRows(null);
      setPhaseLine(null);
      if (!file) return;
      setBusy(true);
      setPhaseLine(labels.phaseReadingFile);
      try {
        const parsed = await parseImportFile(file);
        if (parsed.errors.length > 0) {
          setSummary(labels.parseError);
          setDetail(
            parsed.errors
              .map((e) => resolveParseErrorOrUnknown(e.message, labels))
              .join("\n"),
          );
          return;
        }
        const mapped = mapCsvRecords(parsed.data);
        if (mapped.length === 0) {
          setSummary(labels.noRows);
          return;
        }
        setPhaseLine(labels.phaseValidating);
        const checked = csvStudentRowsSchema.safeParse(mapped);
        if (!checked.success) {
          setSummary(labels.validationError);
          setDetail(JSON.stringify(checked.error.flatten(), null, 2));
          return;
        }
        const startRes = await fetch("/api/admin/import/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, rows: checked.data }),
        });
        const startJson = (await startRes.json()) as {
          ok: boolean;
          code?: string;
          jobId?: string;
          error?: string;
        };
        if (!startJson.ok && startJson.code === "kv_not_configured") {
          setImportTotalRows(checked.data.length);
          setPhaseLine(labels.phaseImportingSync);
          setJobModalOpen(true);
          setLogModalLive(true);
          const result = await bulkImportStudentsFromRows(locale, checked.data);
          const { summary: s, detail: d } = formatImportDoneSummary(labels, result);
          setSummary(s);
          setDetail(d);
          return;
        }
        if (!startJson.ok || !startJson.jobId) {
          setSummary(labels.jobStartError);
          setDetail(
            resolveImportSurfaceMessage(startJson.error ?? startRes.statusText, labels),
          );
          return;
        }
        setImportTotalRows(checked.data.length);
        setPhaseLine(null);
        setJobModalOpen(true);
        setLogModalLive(true);
        setJobId(startJson.jobId);
        const finalSnap = await pollUntilDone({
          jobId: startJson.jobId,
          pollUrl: (id) => `/api/admin/import/jobs/${id}`,
          streamUrl: (id) => `/api/admin/import/jobs/${id}/stream`,
          formatProgressLine: (job: LongJobSnapshot) => {
            if (job.status === "queued") {
              return labels.progressQueued;
            }
            if (job.status === "running" && job.phase === "finalize") {
              return labels.jobLogFinalize;
            }
            if (job.status === "running") {
              return labels.progressRow
                .replace("{{current}}", String(job.current ?? 0))
                .replace("{{total}}", String(job.total ?? 0));
            }
            return null;
          },
          isTerminal: (job) => job.status === "done" || job.status === "error",
        });
        setPhaseLine(null);
        if (finalSnap.status === "error") {
          if (finalSnap.error === IMPORT_JOB_CANCELLED_BY_USER) {
            setSummary(labels.importCancelledTitle);
            setDetail(labels.importCancelledByUser);
            return;
          }
          setSummary(labels.genericError);
          setDetail(resolveImportSurfaceMessage(finalSnap.error, labels));
          return;
        }
        if (finalSnap.status === "done" && finalSnap.result) {
          const { summary: s, detail: d } = formatImportDoneSummary(
            labels,
            finalSnap.result as BulkImportResult,
          );
          setSummary(s);
          setDetail(d);
        }
      } catch (e) {
        setSummary(labels.genericError);
        setDetail(
          e instanceof Error ? resolveImportSurfaceMessage(e.message, labels) : labels.unknownError,
        );
      } finally {
        setLogModalLive(false);
        resetCancelState();
        setPhaseLine(null);
        setBusy(false);
      }
    },
    [labels, locale, pollUntilDone, reset, resetCancelState, setJobId],
  );
  const inlineProgress = jobModalOpen && logModalLive ? null : (liveLine ?? phaseLine);

  return (
    <div className="max-w-xl space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6">
      <h2 className="text-lg font-semibold text-[var(--color-secondary)]">{labels.title}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.hint}</p>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
      <LongJobActivityModal
        open={jobModalOpen}
        onOpenChange={(open: boolean) => {
          setJobModalOpen(open);
          if (!open) { reset(); resetCancelState(); setImportTotalRows(null); }
        }}
        titleId="import-activity-modal-title"
        title={labels.activityModalTitle}
        introLine={activityModalCopy.introLine}
        primaryLine={activityModalCopy.primaryLine}
        secondaryLine={activityModalCopy.secondaryLine}
        explainBody={activityModalCopy.explainBody}
        logTitle={activityModalCopy.logTitle}
        lines={activityLines}
        emptyLogLine={emptyLogPlaceholder}
        isRunning={logModalLive}
        isCancelling={cancelBusy}
        onCancel={jobId ? cancelImport : undefined}
        cancelLabel={labels.activityModalCancel}
        runningAriaLabel={labels.processing}
        closeLabel={labels.activityModalClose}
      />
      <LongJobLoader
        isRunning={busy}
        runningAriaLabel={labels.processing}
        progressLine={inlineProgress}
        statusMessage={summary}
        errorDetail={detail}
      />
    </div>
  );
}
