"use client";

import type { AdminRetentionCandidate } from "@/lib/academics/loadAdminRetentionCandidates";
import type { Dictionary } from "@/types/i18n";
import { AdminRetentionWatchToggle } from "@/components/molecules/AdminRetentionWatchToggle";

export interface AdminRetentionTableProps {
  locale: string;
  brandAppName: string;
  rows: AdminRetentionCandidate[];
  dict: Dictionary["dashboard"]["adminRetention"];
}

function buildSignals(row: AdminRetentionCandidate, dict: Dictionary["dashboard"]["adminRetention"]) {
  const parts: string[] = [];
  if (row.reasons.includes("absences")) {
    parts.push(`${dict.reasonAbsences}: ${row.trailingAbsences}`);
  }
  if (row.reasons.includes("low_average")) {
    parts.push(
      `${dict.reasonLowAverage}: ${row.avgScore != null ? String(row.avgScore) : dict.avgMissing}`,
    );
  }
  return parts.join(" · ");
}

function buildWhatsappHref(row: AdminRetentionCandidate, brandAppName: string, dict: Dictionary["dashboard"]["adminRetention"]) {
  if (!row.guardianPhoneDigits) return null;
  const signals = buildSignals(row, dict);
  const text = dict.whatsappMessage
    .replaceAll("{institute}", brandAppName)
    .replaceAll("{student}", row.studentLabel)
    .replaceAll("{section}", row.sectionName)
    .replaceAll("{signals}", signals);
  return `https://wa.me/${row.guardianPhoneDigits}?text=${encodeURIComponent(text)}`;
}

export function AdminRetentionTable({ locale, brandAppName, rows, dict }: AdminRetentionTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 text-xs uppercase text-[var(--color-muted-foreground)]">
          <tr>
            <th className="px-3 py-2">{dict.colStudent}</th>
            <th className="px-3 py-2">{dict.colSection}</th>
            <th className="px-3 py-2">{dict.colAbsences}</th>
            <th className="px-3 py-2">{dict.colAverage}</th>
            <th className="px-3 py-2">{dict.colReasons}</th>
            <th className="px-3 py-2">{dict.colWatch}</th>
            <th className="px-3 py-2">{dict.colContact}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.map((row) => {
            const wa = buildWhatsappHref(row, brandAppName, dict);
            return (
              <tr key={row.enrollmentId} className="text-[var(--color-foreground)]">
                <td className="px-3 py-3 font-medium">{row.studentLabel}</td>
                <td className="px-3 py-3">{row.sectionName}</td>
                <td className="px-3 py-3">{row.trailingAbsences}</td>
                <td className="px-3 py-3">{row.avgScore != null ? row.avgScore : dict.avgMissing}</td>
                <td className="px-3 py-3">
                  <ul className="list-inside list-disc text-xs">
                    {row.reasons.includes("absences") ? <li>{dict.reasonAbsences}</li> : null}
                    {row.reasons.includes("low_average") ? <li>{dict.reasonLowAverage}</li> : null}
                  </ul>
                </td>
                <td className="px-3 py-3">
                  <AdminRetentionWatchToggle
                    locale={locale}
                    enrollmentId={row.enrollmentId}
                    initialWatch={row.watch}
                    ariaLabel={dict.watchAria}
                  />
                </td>
                <td className="px-3 py-3">
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {dict.contactWhatsapp}
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--color-muted-foreground)]">{dict.contactNoPhone}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
