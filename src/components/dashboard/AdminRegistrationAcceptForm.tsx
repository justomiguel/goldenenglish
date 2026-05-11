"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  acceptRegistration,
  type AcceptRegistrationResult,
} from "@/app/[locale]/dashboard/admin/registrations/actions";
import { enrollStudentInSectionAction } from "@/app/[locale]/dashboard/admin/academic/enrollmentActions";
import { Check, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { AdminRegistrationAcceptSectionPicker } from "@/components/dashboard/AdminRegistrationAcceptSectionPicker";
import { AdminRegistrationAcceptExplainer } from "@/components/dashboard/AdminRegistrationAcceptExplainer";
import { AdminRegistrationAcceptSummary } from "@/components/dashboard/AdminRegistrationAcceptSummary";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";

export type RegistrationAcceptUserLabels = Pick<
  Dictionary["admin"]["users"],
  "password" | "passwordHint"
>;

export interface AdminRegistrationAcceptFormProps {
  locale: string;
  row: AdminRegistrationRow;
  legalAgeMajority: number;
  busy: boolean;
  onBusy: (id: string | null) => void;
  onClose: () => void;
  onSuccess: () => void;
  labels: Dictionary["admin"]["registrations"];
  userLabels: RegistrationAcceptUserLabels;
  currentCohortSections?: CurrentCohortSection[];
  currentCohortName?: string;
}

export function AdminRegistrationAcceptForm({
  locale,
  row,
  legalAgeMajority,
  busy,
  onBusy,
  onClose,
  onSuccess,
  labels,
  currentCohortSections,
  currentCohortName,
}: AdminRegistrationAcceptFormProps) {
  const hasBirth = Boolean(
    row.birth_date && /^\d{4}-\d{2}-\d{2}/.test(row.birth_date),
  );
  const [birth, setBirth] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<"accept" | "section">("accept");
  const [acceptedStudentId, setAcceptedStudentId] = useState<string | null>(null);

  const effectiveBirth = useMemo(() => {
    const b = birth.trim() || (row.birth_date?.slice(0, 10) ?? "");
    return /^\d{4}-\d{2}-\d{2}$/.test(b) ? b : "";
  }, [birth, row.birth_date]);

  const treatsAsMinor = useMemo(() => {
    if (!effectiveBirth) return false;
    return fullYearsFromIsoDate(effectiveBirth) < legalAgeMajority;
  }, [effectiveBirth, legalAgeMajority]);

  const hasSections = Boolean(currentCohortSections?.length);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    onBusy(row.id);
    setFormError(null);
    const res: AcceptRegistrationResult = await acceptRegistration(locale, {
      registration_id: row.id,
      birth_date: birth.trim() || undefined,
    });
    onBusy(null);
    if (res.ok) {
      if (hasSections) {
        setAcceptedStudentId(res.studentId);
        setStep("section");
      } else {
        onClose();
        onSuccess();
      }
      return;
    }
    setFormError(res.message ?? labels.acceptError);
  }

  async function onPickSection(sectionId: string) {
    if (!acceptedStudentId) return;
    onBusy(row.id);
    setFormError(null);
    const res = await enrollStudentInSectionAction({
      locale,
      studentId: acceptedStudentId,
      sectionId,
    });
    onBusy(null);
    if (res.ok) {
      onClose();
      onSuccess();
      return;
    }
    setFormError(labels.sectionEnrollError ?? res.code);
  }

  function onSkipSection() {
    onClose();
    onSuccess();
  }

  const showTutorBlock =
    treatsAsMinor &&
    (Boolean(row.tutor_dni?.trim()) ||
      Boolean(row.tutor_name?.trim()) ||
      Boolean(row.tutor_email?.trim()));

  if (step === "section" && acceptedStudentId) {
    return (
      <AdminRegistrationAcceptSectionPicker
        busy={busy}
        formError={formError}
        sections={currentCohortSections ?? []}
        cohortName={currentCohortName}
        labels={labels}
        onPickSection={onPickSection}
        onSkipSection={onSkipSection}
      />
    );
  }

  return (
    <>
      <AdminRegistrationAcceptSummary
        locale={locale}
        row={row}
        labels={labels}
        hasBirth={hasBirth}
        treatsAsMinor={treatsAsMinor}
        showTutorBlock={showTutorBlock}
      />

      <AdminRegistrationAcceptExplainer labels={labels} hasSections={hasSections} />

      <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
        {!hasBirth ? (
          <div>
            <Label htmlFor="acc-bd">{labels.birthDate}</Label>
            <Input
              id="acc-bd"
              type="date"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              className="mt-1 w-full"
            />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {labels.birthDateHint}
            </p>
          </div>
        ) : null}

        {formError ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-[44px] px-4"
            onClick={onClose}
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {labels.cancel}
          </Button>
          <Button type="submit" className="min-h-[44px] px-4" disabled={busy} isLoading={busy}>
            {busy ? null : <Check className="h-4 w-4 shrink-0" aria-hidden />}
            {labels.accept}
          </Button>
        </div>
      </form>
    </>
  );
}
