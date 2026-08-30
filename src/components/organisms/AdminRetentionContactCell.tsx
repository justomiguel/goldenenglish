import { Mail, MessageCircle } from "lucide-react";
import type { AdminRetentionCandidate } from "@/lib/academics/loadAdminRetentionCandidates";
import type { Dictionary } from "@/types/i18n";

const iconShell =
  "inline-flex min-h-9 min-w-9 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] transition-colors";
const iconActive = `${iconShell} bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]`;
const iconDisabled = `${iconShell} cursor-not-allowed opacity-50`;

interface AdminRetentionContactCellProps {
  row: AdminRetentionCandidate;
  wa: string | null;
  waTip: string;
  mailTip: string;
  dict: Dictionary["dashboard"]["adminRetention"];
  pendingMailId: string | null;
  pendingWaId: string | null;
  onWhatsapp: (row: AdminRetentionCandidate, wa: string) => void;
  onMail: (row: AdminRetentionCandidate) => void;
}

export function AdminRetentionContactCell({
  row,
  wa,
  waTip,
  mailTip,
  dict,
  pendingMailId,
  pendingWaId,
  onWhatsapp,
  onMail,
}: AdminRetentionContactCellProps) {
  const phoneForTip = row.guardianPhoneDisplay ?? row.guardianPhoneDigits ?? "";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {wa && phoneForTip ? (
        <button
          type="button"
          title={waTip}
          className={`${iconActive} text-emerald-600 disabled:pointer-events-none disabled:opacity-50`}
          aria-label={waTip}
          aria-busy={pendingWaId === row.enrollmentId}
          disabled={pendingWaId === row.enrollmentId}
          onClick={() => onWhatsapp(row, wa)}
        >
          {pendingWaId === row.enrollmentId ? (
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          ) : (
            <MessageCircle className="h-5 w-5" aria-hidden />
          )}
        </button>
      ) : (
        <span className={iconDisabled} title={dict.contactNoPhone} aria-label={dict.contactNoPhone}>
          <MessageCircle className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
        </span>
      )}

      {row.mailUserId && row.guardianEmail ? (
        <button
          type="button"
          disabled={pendingMailId === row.enrollmentId}
          className={`${iconActive} h-9 min-w-9 shrink-0 p-0 text-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50`}
          title={mailTip}
          aria-label={mailTip}
          aria-busy={pendingMailId === row.enrollmentId}
          onClick={() => onMail(row)}
        >
          {pendingMailId === row.enrollmentId ? (
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          ) : (
            <Mail className="h-5 w-5" aria-hidden />
          )}
        </button>
      ) : (
        <span className={iconDisabled} title={dict.contactNoEmail} aria-label={dict.contactNoEmail}>
          <Mail className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
        </span>
      )}
    </div>
  );
}
