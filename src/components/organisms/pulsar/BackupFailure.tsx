import { backupErrorSentence } from "@/lib/pulsar/backup/backupErrorSentence";

export function BackupFailure({
  code,
  errors,
}: {
  code: string;
  errors: Record<string, string>;
}) {
  return (
    <p role="alert" className="text-sm text-[var(--color-error)]">
      {backupErrorSentence(errors, code)}
    </p>
  );
}
