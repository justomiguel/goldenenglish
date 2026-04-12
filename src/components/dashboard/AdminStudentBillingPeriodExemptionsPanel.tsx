"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { applyExemptionRange, setPeriodExemption } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminStudentBillingPeriodExemptionsPanelProps {
  locale: Locale;
  studentId: string;
  labels: BillingLabels;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setMsg: (v: string | null) => void;
}

export function AdminStudentBillingPeriodExemptionsPanel({
  locale,
  studentId,
  labels,
  busy,
  setBusy,
  setMsg,
}: AdminStudentBillingPeriodExemptionsPanelProps) {
  const router = useRouter();
  const [exY, setExY] = useState(new Date().getFullYear());
  const [exM, setExM] = useState(1);
  const [rFromY, setRFromY] = useState(new Date().getFullYear());
  const [rFromM, setRFromM] = useState(1);
  const [rToY, setRToY] = useState(new Date().getFullYear());
  const [rToM, setRToM] = useState(12);

  async function toggleExempt(period: { year: number; month: number }, exempt: boolean) {
    setBusy(true);
    setMsg(null);
    const res = await setPeriodExemption({
      locale,
      studentId,
      year: period.year,
      month: period.month,
      exempt,
    });
    setBusy(false);
    setMsg(res.ok ? labels.exemptionUpdated : res.message ?? labels.error);
    if (res.ok) router.refresh();
  }

  async function saveRange(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await applyExemptionRange({
      locale,
      studentId,
      fromYear: rFromY,
      fromMonth: rFromM,
      toYear: rToY,
      toMonth: rToM,
    });
    setBusy(false);
    setMsg(res.ok ? labels.exemptionRangeDone : res.message ?? labels.error);
    if (res.ok) router.refresh();
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="font-semibold text-[var(--color-secondary)]">{labels.exemptionTitle}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.exemptionLead}</p>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <Label>{labels.periodMonth}</Label>
          <Input
            type="number"
            min={1}
            max={12}
            value={exM}
            onChange={(e) => setExM(Number(e.target.value))}
            className="mt-1 w-20"
          />
        </div>
        <div>
          <Label>{labels.periodYear}</Label>
          <Input
            type="number"
            value={exY}
            onChange={(e) => setExY(Number(e.target.value))}
            className="mt-1 w-28"
          />
        </div>
        <Button
          type="button"
          className="min-h-[44px]"
          disabled={busy}
          onClick={() => toggleExempt({ year: exY, month: exM }, true)}
        >
          {labels.exemptPeriod}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-[44px]"
          disabled={busy}
          onClick={() => toggleExempt({ year: exY, month: exM }, false)}
        >
          {labels.unexemptPeriod}
        </Button>
      </div>
      <form onSubmit={saveRange} className="mt-6 flex flex-wrap items-end gap-2 border-t border-[var(--color-border)] pt-4">
        <p className="w-full text-sm font-medium text-[var(--color-foreground)]">{labels.exemptionRange}</p>
        <div>
          <Label>{labels.from}</Label>
          <div className="mt-1 flex gap-1">
            <Input
              type="number"
              min={1}
              max={12}
              value={rFromM}
              onChange={(e) => setRFromM(Number(e.target.value))}
              className="w-16"
            />
            <Input
              type="number"
              value={rFromY}
              onChange={(e) => setRFromY(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
        <div>
          <Label>{labels.to}</Label>
          <div className="mt-1 flex gap-1">
            <Input
              type="number"
              min={1}
              max={12}
              value={rToM}
              onChange={(e) => setRToM(Number(e.target.value))}
              className="w-16"
            />
            <Input
              type="number"
              value={rToY}
              onChange={(e) => setRToY(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
        <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px]">
          {labels.exemptRangeSubmit}
        </Button>
      </form>
    </section>
  );
}
