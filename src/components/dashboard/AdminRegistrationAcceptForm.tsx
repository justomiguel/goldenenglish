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
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

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
      <dl className="grid gap-1 text-sm">
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.name}</dt>
          <dd className="font-medium">
            {formatProfileNameSurnameFirst(row.first_name, row.last_name)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.email}</dt>
          <dd>{row.email}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.dni}</dt>
          <dd>{row.dni}</dd>
        </div>
        {hasBirth ? (
          <div>
            <dt className="text-[var(--color-muted-foreground)]">{labels.birthDate}</dt>
            <dd>
              {new Date(`${row.birth_date!.slice(0, 10)}T12:00:00`).toLocaleDateString(
                locale,
                { year: "numeric", month: "short", day: "numeric" },
              )}
            </dd>
          </div>
        ) : null}
      </dl>

      {treatsAsMinor ? (
        <p className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-2 text-xs text-[var(--color-foreground)]">
          {labels.acceptMinorHint}
        </p>
      ) : null}

      {showTutorBlock ? (
        <div className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2 text-sm">
          <p className="font-semibold text-[var(--color-secondary)]">
            {labels.tutorOnRequestTitle}
          </p>
          <dl className="mt-2 grid gap-1 text-xs">
            <div>
              <dt className="text-[var(--color-muted-foreground)]">{labels.tutorOnRequestName}</dt>
              <dd>{row.tutor_name?.trim() || labels.emptyValue}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">{labels.tutorOnRequestDni}</dt>
              <dd>{row.tutor_dni?.trim() || labels.emptyValue}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">
                {labels.tutorOnRequestEmail}
              </dt>
              <dd>{row.tutor_email?.trim() || labels.emptyValue}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">
                {labels.tutorOnRequestRelationship}
              </dt>
              <dd>{row.tutor_relationship?.trim() || labels.emptyValue}</dd>
            </div>
          </dl>
        </div>
      ) : null}

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
