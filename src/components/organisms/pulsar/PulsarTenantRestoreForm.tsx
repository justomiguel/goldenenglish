"use client";

import { useState } from "react";
import { ArchiveRestore } from "lucide-react";
import {
  prepareInstituteBackupUploadAction,
  startInstituteBackupImportAction,
} from "@/app/[locale]/admin/backupActions";
import { Button } from "@/components/atoms/Button";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { LongJobActivityModal } from "@/components/molecules/LongJobActivityModal";
import { LongJobLoader } from "@/components/molecules/LongJobLoader";
import { BackupFailure } from "@/components/organisms/pulsar/BackupFailure";
import { useLongJobPoll } from "@/hooks/useLongJobPoll";
import { uploadFileToSignedUrlWithProgress } from "@/lib/client/uploadFileToSignedUrlWithProgress";
import type { Dictionary } from "@/types/i18n";

type BackupCopy = Dictionary["pulsar"]["admin"]["form"]["backup"];

const fieldClass =
  "mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2";

function lineFor(copy: BackupCopy, code: string): string {
  const activity = copy.activity as Record<string, string>;
  return activity[code] ?? code;
}

export function PulsarTenantRestoreForm({ locale, copy }: { locale: string; copy: BackupCopy }) {
  const [password, setPassword] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [percent, setPercent] = useState(0);
  const [running, setRunning] = useState(false);
  const { liveLine, jobSnapshot, pollUntilDone } = useLongJobPoll();

  const activity = Array.isArray(jobSnapshot?.activity)
    ? (jobSnapshot.activity as { code: string }[])
    : [];
  const jobError = typeof jobSnapshot?.errorCode === "string" ? jobSnapshot.errorCode : errorCode;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setErrorCode(null);
    setSending(true);
    setPercent(0);
    const prepared = await prepareInstituteBackupUploadAction({ password, passphrase });
    if (!prepared.ok) {
      setSending(false);
      setErrorCode(prepared.code);
      return;
    }
    try {
      await uploadFileToSignedUrlWithProgress({
        supabaseUrl: prepared.supabaseUrl,
        bucket: prepared.bucket,
        storagePath: prepared.path,
        token: prepared.token,
        file,
        onProgress: setPercent,
      });
    } catch {
      setSending(false);
      setErrorCode("storage_failed");
      return;
    }
    setSending(false);
    setRunning(true);
    const started = await startInstituteBackupImportAction({
      locale,
      objectPath: prepared.path,
      password,
      passphrase,
    });
    if (!started.ok) {
      setRunning(false);
      setErrorCode(started.code);
      return;
    }
    await pollUntilDone({
      jobId: started.jobId,
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
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-medium tracking-tight">{copy.restoreTitle}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.restoreLead}</p>
      <label className="block text-sm">
        {copy.fileLabel}
        <input
          className={fieldClass}
          type="file"
          accept=".cbk,application/octet-stream"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />
      </label>
      <label className="block text-sm">
        {copy.passphraseLabel}
        <input className={fieldClass} type="password" autoComplete="off" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} required />
      </label>
      <label className="block text-sm">
        {copy.passwordLabel}
        <input className={fieldClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      {sending ? <InlineUploadProgressBar label={copy.uploadSending} value={percent} /> : null}
      {running || jobSnapshot ? (
        <LongJobLoader
          isRunning={running}
          runningAriaLabel={copy.jobRunning}
          progressLine={liveLine}
          statusMessage={jobSnapshot?.status === "done" ? copy.activity.done : null}
          errorDetail={null}
        />
      ) : null}
      {jobError ? <BackupFailure code={jobError} errors={copy.errors} /> : null}
      {jobSnapshot?.imagesSkipped === true ? <p className="text-sm">{copy.imagesSkipped}</p> : null}
      <Button type="submit" disabled={sending || running}>
        <ArchiveRestore className="h-4 w-4" aria-hidden />
        {copy.restoreSubmit}
      </Button>
      <LongJobActivityModal
        open={running}
        onOpenChange={() => undefined}
        titleId="backup-restore-job"
        title={copy.jobTitle}
        introLine={copy.jobIntro}
        primaryLine={liveLine ?? copy.jobRunning}
        secondaryLine={null}
        explainBody={copy.jobExplain}
        logTitle={copy.jobLog}
        lines={activity.map((row) => lineFor(copy, row.code))}
        emptyLogLine={copy.emptyLog}
        isRunning={running}
        closeLabel={copy.jobClose}
      />
    </form>
  );
}
