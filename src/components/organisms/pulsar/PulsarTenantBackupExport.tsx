"use client";

import { useState } from "react";
import { DatabaseBackup } from "lucide-react";
import { startInstituteBackupExportAction } from "@/app/[locale]/admin/backupActions";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { LongJobActivityModal } from "@/components/molecules/LongJobActivityModal";
import { LongJobLoader } from "@/components/molecules/LongJobLoader";
import { BackupFailure } from "@/components/organisms/pulsar/BackupFailure";
import { useLongJobPoll } from "@/hooks/useLongJobPoll";
import type { Dictionary } from "@/types/i18n";

type BackupCopy = Dictionary["pulsar"]["admin"]["form"]["backup"];

const fieldClass =
  "mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2";

function lineFor(copy: BackupCopy, code: string): string {
  const activity = copy.activity as Record<string, string>;
  return activity[code] ?? code;
}

export function PulsarTenantBackupExport({
  locale,
  slug,
  copy,
}: {
  locale: string;
  slug: string;
  copy: BackupCopy;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [again, setAgain] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const { liveLine, jobSnapshot, pollUntilDone, reset } = useLongJobPoll();

  const activity = Array.isArray(jobSnapshot?.activity)
    ? (jobSnapshot.activity as { code: string }[])
    : [];
  const lines = activity.map((row) => lineFor(copy, row.code));
  const failed = jobSnapshot?.status === "error";
  const jobError = typeof jobSnapshot?.errorCode === "string" ? jobSnapshot.errorCode : null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorCode(null);
    setRunning(true);
    const result = await startInstituteBackupExportAction({
      locale,
      slug,
      password,
      passphrase,
      passphraseAgain: again,
    });
    if (!result.ok) {
      setErrorCode(result.code);
      setRunning(false);
      return;
    }
    setOpen(false);
    const snapshot = await pollUntilDone({
      jobId: result.jobId,
      pollUrl: (id) => `/api/pulsar/backup/jobs/${id}`,
      streamUrl: (id) => `/api/pulsar/backup/jobs/${id}/stream`,
      isTerminal: (snap) => snap.status === "done" || snap.status === "error",
      formatProgressLine: (snap) => {
        const rows = Array.isArray(snap.activity) ? (snap.activity as { code: string }[]) : [];
        const last = rows[rows.length - 1];
        return last ? lineFor(copy, last.code) : copy.jobRunning;
      },
    });
    setRunning(false);
    const url = snapshot.downloadUrl;
    if (snapshot.status === "done" && typeof url === "string" && url) {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.rel = "noopener";
      anchor.download = typeof snapshot.downloadName === "string" ? snapshot.downloadName : "backup.cbk";
      anchor.click();
    }
  }

  return (
    <div className="mt-6">
      <Button type="button" variant="secondary" onClick={() => { reset(); setOpen(true); }}>
        <DatabaseBackup className="h-4 w-4" aria-hidden />
        {copy.exportCta}
      </Button>
      {running || jobSnapshot ? (
        <div className="mt-4">
          <LongJobLoader
            isRunning={running}
            runningAriaLabel={copy.jobRunning}
            progressLine={liveLine}
            statusMessage={jobSnapshot?.status === "done" ? copy.downloadReady : null}
            errorDetail={failed && jobError ? null : null}
          />
          {failed && jobError ? <BackupFailure code={jobError} errors={copy.errors} /> : null}
          {jobSnapshot?.imagesSkipped === true ? <p className="text-sm">{copy.imagesSkipped}</p> : null}
        </div>
      ) : null}
      <Modal open={open} onOpenChange={setOpen} titleId="backup-export-title" title={copy.exportTitle}>
        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-sm text-[var(--color-muted-foreground)]">{copy.exportLead}</p>
          <label className="block text-sm">
            {copy.passwordLabel}
            <input className={fieldClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <label className="block text-sm">
            {copy.passphraseLabel}
            <input className={fieldClass} type="password" autoComplete="new-password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} required />
          </label>
          <label className="block text-sm">
            {copy.passphraseAgainLabel}
            <input className={fieldClass} type="password" autoComplete="new-password" value={again} onChange={(event) => setAgain(event.target.value)} required />
          </label>
          {errorCode ? <BackupFailure code={errorCode} errors={copy.errors} /> : null}
          <Button type="submit">
            <DatabaseBackup className="h-4 w-4" aria-hidden />
            {copy.exportSubmit}
          </Button>
        </form>
      </Modal>
      <LongJobActivityModal
        open={running}
        onOpenChange={(next) => { if (!running) setRunning(next); }}
        titleId="backup-job-title"
        title={copy.jobTitle}
        introLine={copy.jobIntro}
        primaryLine={liveLine ?? copy.jobRunning}
        secondaryLine={null}
        explainBody={copy.jobExplain}
        logTitle={copy.jobLog}
        lines={lines}
        emptyLogLine={copy.emptyLog}
        isRunning={running}
        closeLabel={copy.jobClose}
      />
    </div>
  );
}
