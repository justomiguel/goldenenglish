"use client";

import { Plus, Save, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { ScholarshipDiscountFields } from "@/components/molecules/ScholarshipDiscountFields";
import type { AdminBillingScholarship } from "@/types/adminStudentBilling";
import type { Dictionary, Locale } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminStudentBillingScholarshipFormProps {
  locale: Locale;
  sectionId: string | null;
  referenceMonthlyAmount: number | null;
  referenceMonthlyCurrency: string | null;
  labels: BillingLabels;
  busy: boolean;
  editing: AdminBillingScholarship | null;
  resolvedPercent: number | null;
  note: string;
  vfY: string;
  vfM: string;
  vuY: string;
  vuM: string;
  schActive: boolean;
  setResolvedPercent: (v: number | null) => void;
  setNote: (v: string) => void;
  setVfY: (v: string) => void;
  setVfM: (v: string) => void;
  setVuY: (v: string) => void;
  setVuM: (v: string) => void;
  setSchActive: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
}

export function AdminStudentBillingScholarshipForm({
  locale,
  sectionId,
  referenceMonthlyAmount,
  referenceMonthlyCurrency,
  labels,
  busy,
  editing,
  note,
  vfY,
  vfM,
  vuY,
  vuM,
  schActive,
  setResolvedPercent,
  setNote,
  setVfY,
  setVfM,
  setVuY,
  setVuM,
  setSchActive,
  onSubmit,
  onCancelEdit,
}: AdminStudentBillingScholarshipFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2" data-tour={ADMIN_TOUR_ANCHORS.scholarshipDiscountFields}>
        <ScholarshipDiscountFields
          idPrefix="sch"
          locale={locale}
          currency={referenceMonthlyCurrency}
          referenceMonthlyAmount={referenceMonthlyAmount}
          labels={labels}
          disabled={busy}
          minPercent={0.5}
          defaultPercent={editing ? String(editing.discount_percent) : ""}
          onResolvedPercentChange={setResolvedPercent}
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
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button
          type="submit"
          disabled={busy || !sectionId}
          isLoading={busy}
          className="min-h-[44px]"
          data-tour={ADMIN_TOUR_ANCHORS.scholarshipSave}
        >
          {busy ? null : editing ? (
            <Save className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {editing ? labels.updateScholarship : labels.addScholarship}
        </Button>
        {editing ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onCancelEdit}
            className="min-h-[44px]"
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {labels.cancel}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
