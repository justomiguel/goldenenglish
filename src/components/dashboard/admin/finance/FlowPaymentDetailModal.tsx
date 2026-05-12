"use client";

import { useId, useMemo } from "react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { X } from "lucide-react";
import type { Dictionary, Locale } from "@/types/i18n";
import type { SectionCollectionsFlowFinalizeSummary } from "@/types/sectionCollectionsTabs";

type CollectionsTabsDict = Dictionary["admin"]["finance"]["collections"]["sectionTabs"];

export interface FlowPaymentDetailModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  dict: CollectionsTabsDict;
  /** Surfaced in the title so admin sees who/which period this row belongs to. */
  studentDisplayName: string;
  periodLabel: string;
  finalize: SectionCollectionsFlowFinalizeSummary;
}

export function FlowPaymentDetailModal({
  open,
  onClose,
  locale,
  dict,
  studentDisplayName,
  periodLabel,
  finalize,
}: FlowPaymentDetailModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const empty = dict.historyFlowDetailEmptyValue;

  const formatMoney = useMemo(
    () => (value: number | null) =>
      value == null
        ? empty
        : new Intl.NumberFormat(locale, {
            style: "currency",
            currency: finalize.currency || "USD",
            maximumFractionDigits: 2,
          }).format(value),
    [locale, finalize.currency, empty],
  );

  const formatDateTime = useMemo(
    () => (iso: string | null) =>
      iso
        ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
        : empty,
    [locale, empty],
  );

  const formatDate = useMemo(
    () => (iso: string | null) =>
      iso
        ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso))
        : empty,
    [locale, empty],
  );

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      titleId={titleId}
      descriptionId={descriptionId}
      title={`${dict.historyFlowDetailTitle} · ${studentDisplayName} · ${periodLabel}`}
    >
      <div className="space-y-4">
        <p id={descriptionId} className="text-sm text-[var(--color-muted-foreground)]">
          {dict.historyFlowDetailIntro}
        </p>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Field label={dict.historyFlowDetailFlowOrder} value={String(finalize.flowOrder)} />
          <Field label={dict.historyFlowDetailCommerceOrder} value={finalize.commerceOrder} />
          <Field label={dict.historyFlowDetailMedia} value={finalize.mediaLabel ?? empty} />
          <Field label={dict.historyFlowDetailPayer} value={finalize.payerEmail ?? empty} />
          <Field label={dict.historyFlowDetailPaidAt} value={formatDateTime(finalize.paidAt)} />
          <Field label={dict.historyFlowDetailAmount} value={formatMoney(finalize.amount)} />
          <Field label={dict.historyFlowDetailFee} value={formatMoney(finalize.fee)} />
          <Field label={dict.historyFlowDetailBalance} value={formatMoney(finalize.balance)} />
          <Field label={dict.historyFlowDetailTransferDate} value={formatDate(finalize.transferDate)} />
          {finalize.conversionRate != null ? (
            <Field
              label={dict.historyFlowDetailConversionRate}
              value={new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(finalize.conversionRate)}
            />
          ) : null}
          {finalize.conversionDate ? (
            <Field
              label={dict.historyFlowDetailConversionDate}
              value={formatDate(finalize.conversionDate)}
            />
          ) : null}
        </dl>
        {finalize.fee == null ? (
          <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
            {dict.historyFlowDetailMissingFee}
          </p>
        ) : null}
        <div className="flex justify-end pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden />
            {dict.historyFlowDetailClose}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="mt-0.5 text-[var(--color-foreground)]">{value}</dd>
    </div>
  );
}
