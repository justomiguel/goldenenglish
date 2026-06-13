"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createStudentScholarship,
  deactivateStudentScholarship,
  updateStudentScholarship,
} from "@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship";
import { Plus, Save, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { ScholarshipDiscountFields } from "@/components/molecules/ScholarshipDiscountFields";
import { AdminStudentBillingScholarshipActiveCard } from "@/components/dashboard/AdminStudentBillingScholarshipActiveCard";
import type { AdminBillingScholarship } from "@/types/adminStudentBilling";
import type { Dictionary, Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminStudentBillingScholarshipPanelProps {
  locale: Locale;
  studentId: string;
  sectionId: string | null;
  sectionName: string | null;
  referenceMonthlyAmount: number | null;
  referenceMonthlyCurrency: string | null;
  scholarships: AdminBillingScholarship[];
  labels: BillingLabels;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setMsg: (v: string | null) => void;
  /** List-only: hide create/edit form (apply new scholarships from the monthly matrix). */
  readOnly?: boolean;
  /** When read-only, still show remove on active scholarships. */
  allowRemove?: boolean;
}

function activeScholarships(rows: AdminBillingScholarship[]) {
  return rows.filter((s) => s.is_active && s.discount_percent > 0);
}

export function AdminStudentBillingScholarshipPanel({
  locale,
  studentId,
  sectionId,
  sectionName,
  referenceMonthlyAmount,
  referenceMonthlyCurrency,
  scholarships,
  labels,
  busy,
  setBusy,
  setMsg,
  readOnly = false,
  allowRemove = false,
}: AdminStudentBillingScholarshipPanelProps) {
  const router = useRouter();
  const [visibleScholarships, setVisibleScholarships] = useState(
    activeScholarships(scholarships),
  );

  useEffect(() => {
    setVisibleScholarships(activeScholarships(scholarships));
  }, [scholarships]);
  const [editing, setEditing] = useState<AdminBillingScholarship | null>(null);
  const [resolvedPercent, setResolvedPercent] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [vfY, setVfY] = useState(String(new Date().getFullYear()));
  const [vfM, setVfM] = useState("1");
  const [vuY, setVuY] = useState("");
  const [vuM, setVuM] = useState("");
  const [schActive, setSchActive] = useState(true);

  function resetForm() {
    setEditing(null);
    setResolvedPercent(null);
    setNote("");
    setVfY(String(new Date().getFullYear()));
    setVfM("1");
    setVuY("");
    setVuM("");
    setSchActive(true);
  }

  function editScholarship(row: AdminBillingScholarship) {
    setEditing(row);
    setResolvedPercent(row.discount_percent);
    setNote(row.note ?? "");
    setVfY(String(row.valid_from_year));
    setVfM(String(row.valid_from_month));
    setVuY(row.valid_until_year == null ? "" : String(row.valid_until_year));
    setVuM(row.valid_until_month == null ? "" : String(row.valid_until_month));
    setSchActive(row.is_active);
  }

  async function saveScholarship(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionId) return;
    setBusy(true);
    setMsg(null);
    const p = resolvedPercent;
    if (p == null || p <= 0 || p > 100) {
      setMsg(labels.scholarshipInvalidPercent);
      setBusy(false);
      return;
    }
    const payload = {
      locale,
      studentId,
      sectionId,
      discountPercent: p,
      note: note.trim() || undefined,
      validFromYear: Number(vfY),
      validFromMonth: Number(vfM),
      validUntilYear: vuY.trim() === "" ? null : Number(vuY),
      validUntilMonth: vuM.trim() === "" ? null : Number(vuM),
      isActive: schActive,
    };
    const res = editing
      ? await updateStudentScholarship({ ...payload, scholarshipId: editing.id })
      : await createStudentScholarship(payload);
    setBusy(false);
    setMsg(res.ok ? labels.saved : res.message ?? labels.error);
    if (res.ok) {
      resetForm();
      router.refresh();
    }
  }

  async function removeScholarship(row: AdminBillingScholarship) {
    if (!sectionId) return;
    setBusy(true);
    setMsg(null);
    const res = await deactivateStudentScholarship({
      locale,
      studentId,
      sectionId,
      scholarshipId: row.id,
    });
    setBusy(false);
    setMsg(res.ok ? labels.saved : res.message ?? labels.error);
    if (res.ok) {
      setVisibleScholarships((current) => current.filter((s) => s.id !== row.id));
      if (editing?.id === row.id) resetForm();
      router.refresh();
    }
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div>
        <h2 className="font-semibold text-[var(--color-secondary)]">{labels.scholarshipTitle}</h2>
        {sectionName ? (
          <p className="mt-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
            {labels.panelAppliesTo.replace("{section}", sectionName)}
          </p>
        ) : null}
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.scholarshipLead}</p>
      </div>

      {visibleScholarships.length > 0 ? (
        <div className="mt-3 space-y-3" aria-live="polite">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            {labels.scholarshipsActiveTitle}
          </p>
          {visibleScholarships.map((row) => (
            <AdminStudentBillingScholarshipActiveCard
              key={row.id}
              row={row}
              labels={labels}
              busy={busy}
              readOnly={readOnly}
              allowRemove={allowRemove}
              onEdit={editScholarship}
              onRemove={removeScholarship}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{labels.scholarshipNone}</p>
      )}

      {readOnly ? null : (
      <form onSubmit={saveScholarship} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
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
            <input type="checkbox" checked={schActive} onChange={(e) => setSchActive(e.target.checked)} />
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
            <Input type="number" value={vfM} onChange={(e) => setVfM(e.target.value)} aria-label={labels.scholarshipAriaMonthFrom} />
            <Input type="number" value={vfY} onChange={(e) => setVfY(e.target.value)} aria-label={labels.scholarshipAriaYearFrom} />
          </div>
        </div>
        <div>
          <Label>{labels.validUntilOptional}</Label>
          <div className="mt-1 flex gap-2">
            <Input type="number" value={vuM} onChange={(e) => setVuM(e.target.value)} placeholder={labels.scholarshipPlaceholderMonth} aria-label={labels.scholarshipAriaMonthUntil} />
            <Input type="number" value={vuY} onChange={(e) => setVuY(e.target.value)} placeholder={labels.scholarshipPlaceholderYear} aria-label={labels.scholarshipAriaYearUntil} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy || !sectionId} isLoading={busy} className="min-h-[44px]">
            {busy ? null : editing ? (
              <Save className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {editing ? labels.updateScholarship : labels.addScholarship}
          </Button>
          {editing ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={resetForm} className="min-h-[44px]">
              <X className="h-4 w-4 shrink-0" aria-hidden />
              {labels.cancel}
            </Button>
          ) : null}
        </div>
      </form>
      )}
    </section>
  );
}
