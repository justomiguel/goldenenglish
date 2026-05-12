"use client";

import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSectionCollectionsPaymentHistoryAction } from "@/app/[locale]/dashboard/admin/finance/collections/[sectionId]/getSectionCollectionsPaymentHistoryAction";
import { Button } from "@/components/atoms/Button";
import { FlowPaymentDetailModal } from "@/components/dashboard/admin/finance/FlowPaymentDetailModal";
import type { SectionCollectionsPaymentHistoryRow } from "@/types/sectionCollectionsTabs";
import type { Dictionary, Locale } from "@/types/i18n";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

const PAGE_SIZE = 20;

function formatPeriod(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

export interface SectionCollectionsHistoryTabProps {
  locale: string;
  sectionId: string;
  dict: CollectionsDict;
  billingLabels: Dictionary["admin"]["billing"];
}

export function SectionCollectionsHistoryTab({
  locale,
  sectionId,
  dict,
  billingLabels,
}: SectionCollectionsHistoryTabProps) {
  const t = dict.sectionTabs;
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SectionCollectionsPaymentHistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flowDetailRow, setFlowDetailRow] = useState<SectionCollectionsPaymentHistoryRow | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    const r = await getSectionCollectionsPaymentHistoryAction({
      locale,
      sectionId,
      page,
      pageSize: PAGE_SIZE,
    });
    setBusy(false);
    if (!r.ok) {
      setError(r.message);
      setRows([]);
      setTotal(0);
      return;
    }
    setRows(r.rows);
    setTotal(r.total);
  }, [locale, sectionId, page]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(frame);
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const fmtDate = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(iso),
      ),
    [locale],
  );

  if (error) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
        {error}
      </p>
    );
  }

  if (!busy && rows.length === 0) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4 text-sm text-[var(--color-muted-foreground)]">
        {t.historyEmpty}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
        {t.historyPageStatus
          .replace("{page}", String(page))
          .replace("{pages}", String(pages))
          .replace("{total}", String(total))}
      </p>
      <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
            <tr>
              <th className="px-3 py-2">{t.historyColStudent}</th>
              <th className="px-3 py-2">{billingLabels.colPeriod}</th>
              <th className="px-3 py-2">{billingLabels.colAmount}</th>
              <th className="px-3 py-2">{billingLabels.colStatus}</th>
              <th className="px-3 py-2">{billingLabels.colReceipt}</th>
              <th className="px-3 py-2">{t.historyColUpdated}</th>
              <th className="px-3 py-2 text-right" />
            </tr>
          </thead>
          <tbody>
            {busy && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[var(--color-muted-foreground)]">
                  …
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const periodLabel = formatPeriod(r.month, r.year);
                return (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/${locale}/dashboard/admin/users/${r.studentId}/billing`}
                        className="font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {r.studentDisplayName}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{periodLabel}</td>
                    <td className="px-3 py-2">
                      {r.amount != null ? String(r.amount) : billingLabels.emptyValue}
                    </td>
                    <td className="px-3 py-2 capitalize">{r.status}</td>
                    <td className="px-3 py-2">
                      {r.receiptSignedUrl ? (
                        <a
                          href={r.receiptSignedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-primary)] underline"
                        >
                          {billingLabels.viewReceipt}
                        </a>
                      ) : (
                        billingLabels.emptyValue
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                      {fmtDate(r.updated_at)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.flowFinalize ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={t.historyFlowDetailAria
                            .replace("{student}", r.studentDisplayName)
                            .replace("{period}", periodLabel)}
                          onClick={() => setFlowDetailRow(r)}
                        >
                          <Info className="h-3.5 w-3.5" aria-hidden />
                          {t.historyFlowDetailButton}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy || page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {t.historyPrev}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy || page >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
          {t.historyNext}
        </Button>
      </div>
      {flowDetailRow?.flowFinalize ? (
        <FlowPaymentDetailModal
          open={Boolean(flowDetailRow)}
          onClose={() => setFlowDetailRow(null)}
          locale={locale as Locale}
          dict={t}
          studentDisplayName={flowDetailRow.studentDisplayName}
          periodLabel={formatPeriod(flowDetailRow.month, flowDetailRow.year)}
          finalize={flowDetailRow.flowFinalize}
        />
      ) : null}
    </div>
  );
}
