"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { AdminRetentionReasonsList } from "@/components/molecules/AdminRetentionReasonsList";
import { AdminRetentionTablePagination } from "@/components/molecules/AdminRetentionTablePagination";
import type { AdminRetentionCandidate } from "@/lib/academics/loadAdminRetentionCandidates";
import {
  buildEmailTooltip,
  buildRetentionSignals,
  buildWhatsappHref,
  buildWhatsappTooltip,
  mapRetentionSendEmailErrorMessage,
} from "@/lib/academics/adminRetentionTableHelpers";
import type { Dictionary } from "@/types/i18n";
import { sendRetentionContactEmailAction } from "@/app/[locale]/dashboard/admin/academic/retentionEmailActions";
import { recordRetentionWhatsappContactAction } from "@/app/[locale]/dashboard/admin/retentionActions";

export interface AdminRetentionTableProps {
  locale: string;
  cohortId: string;
  brandAppName: string;
  rows: AdminRetentionCandidate[];
  dict: Dictionary["dashboard"]["adminRetention"];
  /** Paginación del ranking (faltas desc., desempate promedio). */
  retentionPage?: number;
  retentionPageSize?: number;
  retentionTotal?: number;
  paginationLabels?: Dictionary["admin"]["table"];
}

export function AdminRetentionTable({
  locale,
  cohortId,
  brandAppName,
  rows,
  dict,
  retentionPage,
  retentionPageSize,
  retentionTotal,
  paginationLabels,
}: AdminRetentionTableProps) {
  const router = useRouter();
  const [mailStatus, setMailStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingEnrollmentId, setPendingEnrollmentId] = useState<string | null>(null);
  const [waPendingEnrollmentId, setWaPendingEnrollmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!mailStatus) return;
    const t = setTimeout(() => setMailStatus(null), 5000);
    return () => clearTimeout(t);
  }, [mailStatus]);

  const handleSendMail = (row: AdminRetentionCandidate) => {
    if (!row.mailUserId) return;
    setPendingEnrollmentId(row.enrollmentId);
    setMailStatus(null);
    const loc = locale === "en" || locale === "es" ? locale : "es";
    void (async () => {
      const res = await sendRetentionContactEmailAction({
        locale: loc,
        cohortId,
        studentId: row.studentId,
        enrollmentId: row.enrollmentId,
        mailUserId: row.mailUserId,
        isSelfContact: row.isSelfContact,
        studentLabel: row.studentLabel,
        sectionName: row.sectionName,
        signals: buildRetentionSignals(row, dict),
        guardianLabel: row.mailGuardianLabel ?? "",
      });
      setPendingEnrollmentId(null);
      if (res.ok) {
        setMailStatus({ ok: true, text: dict.contactEmailOk });
        router.refresh();
      } else {
        setMailStatus({ ok: false, text: mapRetentionSendEmailErrorMessage(res, dict) });
      }
    })();
  };

  const openWhatsapp = (row: AdminRetentionCandidate, wa: string) => {
    setWaPendingEnrollmentId(row.enrollmentId);
    setMailStatus(null);
    const loc = locale === "en" || locale === "es" ? locale : "es";
    void (async () => {
      const res = await recordRetentionWhatsappContactAction({
        locale: loc,
        cohortId,
        enrollmentId: row.enrollmentId,
      });
      setWaPendingEnrollmentId(null);
      window.open(wa, "_blank", "noopener,noreferrer");
      if (res.ok) router.refresh();
    })();
  };

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>;
  }

  const iconShell =
    "inline-flex min-h-9 min-w-9 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] transition-colors";
  const iconActive = `${iconShell} bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]`;
  const iconDisabled = `${iconShell} cursor-not-allowed opacity-50`;

  return (
    <div className="space-y-3">
      {mailStatus ? (
        <p
          role="status"
          className={
            mailStatus.ok
              ? "text-sm text-[var(--color-foreground)]"
              : "text-sm text-[var(--color-error)]"
          }
        >
          {mailStatus.text}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 text-xs uppercase text-[var(--color-muted-foreground)]">
          <tr>
            <th className="px-3 py-2">{dict.colStudent}</th>
            <th className="px-3 py-2">{dict.colSection}</th>
            <th className="px-3 py-2">{dict.colAbsences}</th>
            <th className="px-3 py-2">{dict.colAverage}</th>
            <th className="px-3 py-2">{dict.colReasons}</th>
            <th className="px-3 py-2 text-center tabular-nums" scope="col">
              {dict.colWhatsappCount}
            </th>
            <th className="px-3 py-2 text-center tabular-nums" scope="col">
              {dict.colEmailCount}
            </th>
            <th className="px-3 py-2">{dict.colContact}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.map((row) => {
            const wa = buildWhatsappHref(row, brandAppName, dict);
            const phoneForTip = row.guardianPhoneDisplay ?? row.guardianPhoneDigits ?? "";
            const waTemplate = row.isSelfContact ? dict.tipContactWhatsappSelf : dict.tipContactWhatsapp;
            const emailTemplate = row.isSelfContact ? dict.tipContactEmailSelf : dict.tipContactEmail;
            const waTip = wa && phoneForTip ? buildWhatsappTooltip(phoneForTip, waTemplate) : "";
            const mailTip = row.guardianEmail ? buildEmailTooltip(row.guardianEmail, emailTemplate) : "";
            return (
              <tr key={row.enrollmentId} className="text-[var(--color-foreground)]">
                <td className="px-3 py-3 font-medium">{row.studentLabel}</td>
                <td className="px-3 py-3">{row.sectionName}</td>
                <td className="px-3 py-3">{row.trailingAbsences}</td>
                <td className="px-3 py-3">{row.avgScore != null ? row.avgScore : dict.avgMissing}</td>
                <td className="px-3 py-3">
                  <AdminRetentionReasonsList reasons={row.reasons} dict={dict} />
                </td>
                <td className="px-3 py-3 text-center tabular-nums text-[var(--color-foreground)]">
                  {row.retentionWhatsappCount}
                </td>
                <td className="px-3 py-3 text-center tabular-nums text-[var(--color-foreground)]">
                  {row.retentionEmailCount}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {wa && phoneForTip ? (
                      <button
                        type="button"
                        title={waTip}
                        className={`${iconActive} text-emerald-600 disabled:pointer-events-none disabled:opacity-50`}
                        aria-label={waTip}
                        aria-busy={waPendingEnrollmentId === row.enrollmentId}
                        disabled={waPendingEnrollmentId === row.enrollmentId}
                        onClick={() => openWhatsapp(row, wa)}
                      >
                        {waPendingEnrollmentId === row.enrollmentId ? (
                          <span
                            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                            aria-hidden
                          />
                        ) : (
                          <MessageCircle className="h-5 w-5" aria-hidden />
                        )}
                      </button>
                    ) : (
                      <span
                        className={iconDisabled}
                        title={dict.contactNoPhone}
                        aria-label={dict.contactNoPhone}
                      >
                        <MessageCircle className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
                      </span>
                    )}

                    {row.mailUserId && row.guardianEmail ? (
                      <button
                        type="button"
                        disabled={pendingEnrollmentId === row.enrollmentId}
                        className={`${iconActive} h-9 min-w-9 shrink-0 p-0 text-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50`}
                        title={mailTip}
                        aria-label={mailTip}
                        aria-busy={pendingEnrollmentId === row.enrollmentId}
                        onClick={() => handleSendMail(row)}
                      >
                        {pendingEnrollmentId === row.enrollmentId ? (
                          <span
                            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                            aria-hidden
                          />
                        ) : (
                          <Mail className="h-5 w-5" aria-hidden />
                        )}
                      </button>
                    ) : (
                      <span
                        className={iconDisabled}
                        title={dict.contactNoEmail}
                        aria-label={dict.contactNoEmail}
                      >
                        <Mail className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
        {paginationLabels != null &&
        retentionPage != null &&
        retentionPageSize != null &&
        retentionTotal != null && (
          <AdminRetentionTablePagination
            locale={locale}
            cohortId={cohortId}
            page={retentionPage}
            pageSize={retentionPageSize}
            total={retentionTotal}
            labels={paginationLabels}
          />
        )}
      </div>
    </div>
  );
}
