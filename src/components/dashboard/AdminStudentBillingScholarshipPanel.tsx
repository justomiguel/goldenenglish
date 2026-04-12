"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { upsertStudentScholarship } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { AdminBillingScholarship } from "@/components/dashboard/AdminStudentBillingEntry";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminStudentBillingScholarshipPanelProps {
  locale: Locale;
  studentId: string;
  scholarship: AdminBillingScholarship;
  labels: BillingLabels;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setMsg: (v: string | null) => void;
}

export function AdminStudentBillingScholarshipPanel({
  locale,
  studentId,
  scholarship,
  labels,
  busy,
  setBusy,
  setMsg,
}: AdminStudentBillingScholarshipPanelProps) {
  const router = useRouter();
  const [pct, setPct] = useState(String(scholarship?.discount_percent ?? ""));
  const [note, setNote] = useState(scholarship?.note ?? "");
  const [vfY, setVfY] = useState(String(scholarship?.valid_from_year ?? new Date().getFullYear()));
  const [vfM, setVfM] = useState(String(scholarship?.valid_from_month ?? 1));
  const [vuY, setVuY] = useState(
    scholarship?.valid_until_year != null ? String(scholarship.valid_until_year) : "",
  );
  const [vuM, setVuM] = useState(
    scholarship?.valid_until_month != null ? String(scholarship.valid_until_month) : "",
  );
  const [schActive, setSchActive] = useState(scholarship?.is_active ?? true);

  async function saveScholarship(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const p = Number(pct);
    if (Number.isNaN(p) || p < 0 || p > 100) {
      setMsg(labels.scholarshipInvalidPercent);
      setBusy(false);
      return;
    }
    const res = await upsertStudentScholarship({
      locale,
      studentId,
      discountPercent: p,
      note: note.trim() || undefined,
      validFromYear: Number(vfY),
      validFromMonth: Number(vfM),
      validUntilYear: vuY.trim() === "" ? null : Number(vuY),
      validUntilMonth: vuM.trim() === "" ? null : Number(vuM),
      isActive: schActive,
    });
    setBusy(false);
    setMsg(res.ok ? labels.saved : res.message ?? labels.error);
    if (res.ok) router.refresh();
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="font-semibold text-[var(--color-secondary)]">{labels.scholarshipTitle}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.scholarshipLead}</p>
      <form onSubmit={saveScholarship} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="sch-pct">{labels.scholarshipPercent}</Label>
          <Input
            id="sch-pct"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={schActive}
              onChange={(e) => setSchActive(e.target.checked)}
            />
            {labels.scholarshipActive}
          </label>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="sch-note">{labels.scholarshipNote}</Label>
          <Input id="sch-note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>{labels.validFrom}</Label>
          <div className="mt-1 flex gap-2">
            <Input
              type="number"
              value={vfM}
              onChange={(e) => setVfM(e.target.value)}
              aria-label={labels.scholarshipAriaMonthFrom}
            />
            <Input
              type="number"
              value={vfY}
              onChange={(e) => setVfY(e.target.value)}
              aria-label={labels.scholarshipAriaYearFrom}
            />
          </div>
        </div>
        <div>
          <Label>{labels.validUntilOptional}</Label>
          <div className="mt-1 flex gap-2">
            <Input
              type="number"
              value={vuM}
              onChange={(e) => setVuM(e.target.value)}
              placeholder={labels.scholarshipPlaceholderMonth}
              aria-label={labels.scholarshipAriaMonthUntil}
            />
            <Input
              type="number"
              value={vuY}
              onChange={(e) => setVuY(e.target.value)}
              placeholder={labels.scholarshipPlaceholderYear}
              aria-label={labels.scholarshipAriaYearUntil}
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px]">
            {labels.saveScholarship}
          </Button>
        </div>
      </form>
    </section>
  );
}
