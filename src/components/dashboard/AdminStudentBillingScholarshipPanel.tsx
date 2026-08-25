"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createStudentScholarship,
  deactivateStudentScholarship,
  updateStudentScholarship,
} from "@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship";
import { AdminStudentBillingScholarshipActiveCard } from "@/components/dashboard/AdminStudentBillingScholarshipActiveCard";
import { AdminStudentBillingScholarshipForm } from "@/components/dashboard/AdminStudentBillingScholarshipForm";
import type { AdminBillingScholarship } from "@/types/adminStudentBilling";
import type { Dictionary, Locale } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

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
    <section
      data-tour={ADMIN_TOUR_ANCHORS.scholarshipPanel}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]"
    >
      <div>
        <h2 className="font-semibold text-[var(--color-primary)]">{labels.scholarshipTitle}</h2>
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
        <AdminStudentBillingScholarshipForm
          locale={locale}
          sectionId={sectionId}
          referenceMonthlyAmount={referenceMonthlyAmount}
          referenceMonthlyCurrency={referenceMonthlyCurrency}
          labels={labels}
          busy={busy}
          editing={editing}
          resolvedPercent={resolvedPercent}
          note={note}
          vfY={vfY}
          vfM={vfM}
          vuY={vuY}
          vuM={vuM}
          schActive={schActive}
          setResolvedPercent={setResolvedPercent}
          setNote={setNote}
          setVfY={setVfY}
          setVfM={setVfM}
          setVuY={setVuY}
          setVuM={setVuM}
          setSchActive={setSchActive}
          onSubmit={saveScholarship}
          onCancelEdit={resetForm}
        />
      )}
    </section>
  );
}
