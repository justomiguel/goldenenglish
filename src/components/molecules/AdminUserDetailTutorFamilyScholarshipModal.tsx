"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Percent, X } from "lucide-react";
import { applyAdminTutorFamilyScholarshipAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailTutorFamilyScholarshipActions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Modal } from "@/components/atoms/Modal";
import type { AdminUserTutorFamilySectionOptionVM } from "@/lib/dashboard/adminUserDetailVM";
import type { Dictionary, Locale } from "@/types/i18n";

type UserLabels = Dictionary["admin"]["users"];
type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminUserDetailTutorFamilyScholarshipModalProps {
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorId: string;
  sections: AdminUserTutorFamilySectionOptionVM[];
  userLabels: UserLabels;
  billingLabels: BillingLabels;
  onCompleteMessage: (text: string, ok: boolean) => void;
}

export function AdminUserDetailTutorFamilyScholarshipModal({
  locale,
  open,
  onOpenChange,
  tutorId,
  sections,
  userLabels,
  billingLabels,
  onCompleteMessage,
}: AdminUserDetailTutorFamilyScholarshipModalProps) {
  const titleId = useId();
  const descId = useId();
  const [sectionId, setSectionId] = useState("");
  const [pct, setPct] = useState("10");
  const [note, setNote] = useState("");
  const [vfY, setVfY] = useState(String(new Date().getFullYear()));
  const [vfM, setVfM] = useState("1");
  const [vuY, setVuY] = useState("");
  const [vuM, setVuM] = useState("");
  const [schActive, setSchActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const sectionSelectId = useId();

  useEffect(() => {
    if (!open || sections.length === 0) return;
    setSectionId((prev) => (sections.some((s) => s.sectionId === prev) ? prev : sections[0]!.sectionId));
  }, [open, sections]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const discountPercent = Number.parseFloat(pct.replace(",", "."));
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      onCompleteMessage(userLabels.detailErrInvalid, false);
      return;
    }
    const vy = vuY.trim() === "" ? null : Number.parseInt(vuY, 10);
    const vm = vuM.trim() === "" ? null : Number.parseInt(vuM, 10);
    const vfy = Number.parseInt(vfY, 10);
    const vfm = Number.parseInt(vfM, 10);
    if (!Number.isFinite(vfy) || !Number.isFinite(vfm) || vfm < 1 || vfm > 12) {
      onCompleteMessage(userLabels.detailErrInvalid, false);
      return;
    }
    if (!sectionId) {
      onCompleteMessage(userLabels.detailTutorFamilyScholarshipNoSections, false);
      return;
    }
    setBusy(true);
    try {
      const r = await applyAdminTutorFamilyScholarshipAction({
        locale,
        tutorId,
        sectionId,
        discountPercent,
        note: note.trim() || undefined,
        validFromYear: vfy,
        validFromMonth: vfm,
        validUntilYear: vy != null && Number.isFinite(vy) ? vy : null,
        validUntilMonth: vm != null && Number.isFinite(vm) ? vm : null,
        isActive: schActive,
      });
      onCompleteMessage(r.message ?? (r.ok ? "" : userLabels.detailErrSave), r.ok);
      if (r.ok) {
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const noSections = sections.length === 0;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={descId}
      title={userLabels.detailTutorFamilyScholarshipTitle}
      disableClose={busy}
      dialogClassName="max-w-lg"
    >
      <p id={descId} className="text-sm text-[var(--color-muted-foreground)]">
        {userLabels.detailTutorFamilyScholarshipLead}
      </p>
      {noSections ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
          {userLabels.detailTutorFamilyScholarshipNoSections}
        </p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 grid gap-3">
          <div>
            <Label htmlFor={sectionSelectId}>{billingLabels.sectionBenefitSelect}</Label>
            <select
              id={sectionSelectId}
              value={sectionId}
              onChange={(ev) => setSectionId(ev.target.value)}
              disabled={busy || sections.length === 1}
              className="mt-1 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
            >
              {sections.map((s) => (
                <option key={s.sectionId} value={s.sectionId}>
                  {s.sectionLabel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="fam-sch-pct">{billingLabels.scholarshipPercent}</Label>
            <Input
              id="fam-sch-pct"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={pct}
              onChange={(ev) => setPct(ev.target.value)}
              required
              disabled={busy}
              className="mt-1"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={schActive}
              onChange={(ev) => setSchActive(ev.target.checked)}
              disabled={busy}
            />
            {billingLabels.scholarshipActive}
          </label>
          <div className="sm:col-span-2">
            <Label htmlFor="fam-sch-note">{billingLabels.scholarshipNote}</Label>
            <Input id="fam-sch-note" value={note} onChange={(ev) => setNote(ev.target.value)} disabled={busy} className="mt-1" />
          </div>
          <div>
            <Label>{billingLabels.validFrom}</Label>
            <div className="mt-1 flex gap-2">
              <Input
                type="number"
                value={vfM}
                onChange={(ev) => setVfM(ev.target.value)}
                aria-label={billingLabels.scholarshipAriaMonthFrom}
                disabled={busy}
              />
              <Input
                type="number"
                value={vfY}
                onChange={(ev) => setVfY(ev.target.value)}
                aria-label={billingLabels.scholarshipAriaYearFrom}
                disabled={busy}
              />
            </div>
          </div>
          <div>
            <Label>{billingLabels.validUntilOptional}</Label>
            <div className="mt-1 flex gap-2">
              <Input
                type="number"
                value={vuM}
                onChange={(ev) => setVuM(ev.target.value)}
                placeholder={billingLabels.scholarshipPlaceholderMonth}
                aria-label={billingLabels.scholarshipAriaMonthUntil}
                disabled={busy}
              />
              <Input
                type="number"
                value={vuY}
                onChange={(ev) => setVuY(ev.target.value)}
                placeholder={billingLabels.scholarshipPlaceholderYear}
                aria-label={billingLabels.scholarshipAriaYearUntil}
                disabled={busy}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 shrink-0" aria-hidden />
              {userLabels.detailTutorFamilyScholarshipCancel}
            </Button>
            <Button type="submit" disabled={busy || noSections} isLoading={busy}>
              <Percent className="h-4 w-4 shrink-0" aria-hidden />
              {userLabels.detailTutorFamilyScholarshipApply}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
