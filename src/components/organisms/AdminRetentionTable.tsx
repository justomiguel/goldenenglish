"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRetentionContactCell } from "@/components/organisms/AdminRetentionContactCell";
import { AdminRetentionReasonsList } from "@/components/molecules/AdminRetentionReasonsList";
import { AdminRetentionTablePagination } from "@/components/molecules/AdminRetentionTablePagination";
import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";
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

  const sortLabels = tableSortLabels(locale);
  const { sortKey, sortDir, onToggleSort, sortedRows } = useClientTableSort(
    rows,
    {
      student: (row) => row.studentLabel,
      section: (row) => row.sectionName,
      absences: (row) => row.trailingAbsences,
      average: (row) => row.avgScore ?? null,
      reasons: (row) => row.reasons.join(" "),
      whatsapp: (row) => row.retentionWhatsappCount,
      email: (row) => row.retentionEmailCount,
    },
    "absences",
    "desc",
  );

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>;
  }

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
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
        <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 text-xs uppercase text-[var(--color-muted-foreground)]">
          <tr>
            <SortableTh columnId="student" label={dict.colStudent} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="section" label={dict.colSection} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="absences" label={dict.colAbsences} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="average" label={dict.colAverage} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="reasons" label={dict.colReasons} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="whatsapp" label={dict.colWhatsappCount} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2 text-center tabular-nums" />
            <SortableTh columnId="email" label={dict.colEmailCount} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2 text-center tabular-nums" />
            <th className="px-3 py-2">{dict.colContact}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {sortedRows.map((row) => {
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
                  <AdminRetentionContactCell
                    row={row}
                    wa={wa}
                    waTip={waTip}
                    mailTip={mailTip}
                    dict={dict}
                    pendingMailId={pendingEnrollmentId}
                    pendingWaId={waPendingEnrollmentId}
                    onWhatsapp={openWhatsapp}
                    onMail={handleSendMail}
                  />
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
