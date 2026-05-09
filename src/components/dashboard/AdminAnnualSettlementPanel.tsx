"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { Dictionary, Locale } from "@/types/i18n";
import type { AdminStudentBillingSectionBenefit } from "@/types/adminStudentBilling";
import {
  applyAnnualTuitionSettlementAction,
  previewAnnualTuitionSettlementAction,
} from "@/app/[locale]/dashboard/admin/users/[userId]/billing/annualTuitionSettlementActions";
import { AdminAnnualSettlementExistingList } from "@/components/dashboard/AdminAnnualSettlementExistingList";
import { AdminAnnualSettlementPreviewBox } from "@/components/dashboard/AdminAnnualSettlementPreviewBox";

type AnnualLabels = Dictionary["admin"]["billing"]["annualSettlement"];

export interface AdminAnnualSettlementPanelProps {
  locale: Locale;
  studentId: string;
  benefit: AdminStudentBillingSectionBenefit;
  billingYear: number;
  labels: AnnualLabels;
  cancelLabel: string;
}

export function AdminAnnualSettlementPanel({
  locale,
  studentId,
  benefit,
  billingYear,
  labels,
  cancelLabel,
}: AdminAnnualSettlementPanelProps) {
  const router = useRouter();
  const [accepted, setAccepted] = useState("");
  const [includesFee, setIncludesFee] = useState(false);
  const [note, setNote] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [preview, setPreview] = useState<
    Extract<Awaited<ReturnType<typeof previewAnnualTuitionSettlementAction>>, { ok: true }>["data"] | null
  >(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const feeEligible =
    benefit.sectionEnrollmentFeeAmount > 0 && !benefit.enrollmentFeeExempt;

  const money = useCallback(
    (amount: number, currency: string) =>
      new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
        style: "currency",
        currency: currency || "USD",
      }).format(amount),
    [locale],
  );

  const runPreview = async () => {
    setBanner(null);
    const total = Number(accepted.replace(",", "."));
    if (!Number.isFinite(total) || total <= 0) {
      setBanner({ kind: "err", text: labels.errorInvalid });
      return;
    }
    setPreviewBusy(true);
    try {
      const r = await previewAnnualTuitionSettlementAction({
        locale,
        enrollmentId: benefit.enrollmentId,
        coverageYear: billingYear,
        acceptedTotal: total,
        includesEnrollmentFee: includesFee && feeEligible,
      });
      if (!r.ok) {
        setPreview(null);
        setBanner({ kind: "err", text: r.message });
        return;
      }
      setPreview(r.data);
    } finally {
      setPreviewBusy(false);
    }
  };

  const runApply = async () => {
    setApplyBusy(true);
    setBanner(null);
    const total = Number(accepted.replace(",", "."));
    try {
      const r = await applyAnnualTuitionSettlementAction({
        locale,
        studentId,
        enrollmentId: benefit.enrollmentId,
        coverageYear: billingYear,
        acceptedTotal: total,
        includesEnrollmentFee: includesFee && feeEligible,
        adminNote: note.trim() || null,
      });
      if (!r.ok) {
        setBanner({ kind: "err", text: r.message ?? labels.errorSave });
        return;
      }
      setBanner({ kind: "ok", text: r.message ?? labels.applySuccess });
      setConfirmOpen(false);
      setPreview(null);
      router.refresh();
    } finally {
      setApplyBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-secondary)]">{labels.title}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </div>

      <AdminAnnualSettlementExistingList
        settlements={benefit.annualSettlements}
        labels={labels}
        formatMoney={money}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="annual-coverage-year">{labels.coverageYearLabel}</Label>
          <Input
            id="annual-coverage-year"
            type="number"
            readOnly
            value={billingYear}
            className="mt-1"
            aria-readonly="true"
          />
        </div>
        <div>
          <Label htmlFor="annual-accepted">{labels.acceptedLabel}</Label>
          <Input
            id="annual-accepted"
            type="text"
            inputMode="decimal"
            value={accepted}
            onChange={(e) => setAccepted(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includesFee && feeEligible}
          disabled={!feeEligible}
          onChange={(e) => setIncludesFee(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--color-border)]"
        />
        <span className="text-[var(--color-foreground)]">{labels.includesEnrollmentFeeLabel}</span>
      </label>

      <div>
        <Label htmlFor="annual-note">{labels.noteLabel}</Label>
        <Input
          id="annual-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={labels.notePlaceholder}
          className="mt-1"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={previewBusy}
          onClick={() => void runPreview()}
        >
          {previewBusy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Calculator className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {labels.preview}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={!preview || applyBusy}
          onClick={() => setConfirmOpen(true)}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          {labels.apply}
        </Button>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.previewHint}</p>

      {banner ? (
        <p
          role="status"
          className={
            banner.kind === "ok"
              ? "text-sm font-medium text-[var(--color-foreground)]"
              : "text-sm font-medium text-[var(--color-error)]"
          }
        >
          {banner.text}
        </p>
      ) : null}

      {preview ? (
        <AdminAnnualSettlementPreviewBox locale={locale} labels={labels} preview={preview} />
      ) : null}

      <ConfirmActionModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={labels.confirmTitle.replace("{year}", String(billingYear))}
        description={labels.confirmBody.replace("{year}", String(billingYear))}
        cancelLabel={cancelLabel}
        confirmLabel={labels.apply}
        busy={applyBusy}
        disableClose={applyBusy}
        onConfirm={() => void runApply()}
      />
    </section>
  );
}
