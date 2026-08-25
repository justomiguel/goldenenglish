"use client";

import { type FormEvent, useRef, useState } from "react";
import { submitSectionLinkRegistration } from "@/app/[locale]/i/[token]/actions";
import { submitPublicRegistration } from "@/app/[locale]/register/actions";
import { lookupRegistrationStudentAction } from "@/app/[locale]/register/lookupRegistrationStudentAction";
import { Button } from "@/components/atoms/Button";
import { RegisterExistingStudentConfirm } from "@/components/register/RegisterExistingStudentConfirm";
import { RegisterFormContactAndSections } from "@/components/register/RegisterFormContactAndSections";
import { RegisterStudentFieldset } from "@/components/register/RegisterStudentFieldset";
import { RegisterSuccessDialog } from "@/components/molecules/RegisterSuccessDialog";
import { SectionEnrollmentLinkCard } from "@/components/register/SectionEnrollmentLinkCard";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import type { PublicRegistrationInput } from "@/lib/register/publicRegistrationSchema";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { Dictionary } from "@/types/i18n";

type RegisterStep = "student" | "confirm" | "details";

interface RegisterFormProps {
  locale: string;
  dict: Dictionary["register"];
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
}

export function RegisterForm({
  locale,
  dict,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
}: RegisterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<RegisterStep>("student");
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"error" | "muted">("error");
  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [existingMatch, setExistingMatch] = useState<{ firstName: string; lastName: string } | null>(null);
  const [existingConfirmed, setExistingConfirmed] = useState(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);

  const isMinor = birthDate.length === 10 && fullYearsFromIsoDate(birthDate) < legalAgeMajority;
  const showTutor = step === "details" && !existingConfirmed && isMinor;
  const showAdultContact = step === "details" && !existingConfirmed && !isMinor;

  function resetOutcome() {
    setSuccessOpen(false);
    setBirthDate("");
    setStep("student");
    setExistingMatch(null);
    setExistingConfirmed(false);
    setSelectedSectionIds([]);
  }

  async function onContinue() {
    const form = formRef.current;
    if (!form) return;
    if (birthDate.length !== 10) {
      setMsgTone("error");
      setMsg(dict.birthDateIncomplete);
      return;
    }
    if (!form.reportValidity()) return;
    setBusy(true);
    setMsg(null);
    setMsgTone("error");
    const dni = String(new FormData(form).get("dni") ?? "");
    try {
      const lookup = await lookupRegistrationStudentAction(dni);
      if (!lookup.ok) {
        setMsg(dict.lookupFailed);
        return;
      }
      if (lookup.found) {
        setExistingMatch({ firstName: lookup.firstName, lastName: lookup.lastName });
        setExistingConfirmed(false);
        setStep("confirm");
        return;
      }
      setExistingMatch(null);
      setExistingConfirmed(false);
      setStep("details");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step !== "details") return;
    if (birthDate.length !== 10) {
      setMsgTone("error");
      setMsg(dict.birthDateIncomplete);
      return;
    }
    setBusy(true);
    setMsg(null);
    setMsgTone("error");
    const fd = new FormData(e.currentTarget);
    const raw: PublicRegistrationInput = {
      first_name: String(fd.get("first_name") ?? ""),
      last_name: String(fd.get("last_name") ?? ""),
      dni: String(fd.get("dni") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      birth_date: String(fd.get("birth_date") ?? ""),
      preferred_section_id: String(fd.get("preferred_section_id") ?? ""),
      additional_section_ids: fd.getAll("additional_section_ids").map(String).filter(Boolean),
      tutor_name: String(fd.get("tutor_name") ?? ""),
      tutor_dni: String(fd.get("tutor_dni") ?? ""),
      tutor_email: String(fd.get("tutor_email") ?? ""),
      tutor_phone: String(fd.get("tutor_phone") ?? ""),
      tutor_relationship: String(fd.get("tutor_relationship") ?? ""),
    };
    try {
      const res = enrollmentLink
        ? await submitSectionLinkRegistration(locale, enrollmentLink.token, raw)
        : await submitPublicRegistration(locale, raw);
      if (res.ok) {
        formRef.current?.reset();
        resetOutcome();
        setSuccessOpen(true);
        return;
      }
      if (res.message === dict.closed) {
        setMsgTone("muted");
        setMsg(dict.closed);
      } else {
        setMsgTone("error");
        setMsg(res.message?.trim() || dict.error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <RegisterSuccessDialog
        locale={locale}
        open={successOpen}
        onOpenChange={setSuccessOpen}
        dict={dict}
      />
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="w-full max-w-lg space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-primary)]/[0.06]"
      >
        <RegisterStudentFieldset
          locale={locale}
          dict={dict}
          birthDate={birthDate}
          onBirthDateChange={setBirthDate}
          readOnly={step !== "student"}
        />
        {enrollmentLink && step !== "details" ? (
          <SectionEnrollmentLinkCard link={enrollmentLink} labels={dict.sectionLink} />
        ) : null}
        {step === "student" ? (
          <Button type="button" disabled={busy} isLoading={busy} onClick={() => void onContinue()}>
            {dict.continue}
          </Button>
        ) : null}
        {step === "confirm" && existingMatch ? (
          <RegisterExistingStudentConfirm
            dict={dict}
            firstName={existingMatch.firstName}
            lastName={existingMatch.lastName}
            onYes={() => {
              setExistingConfirmed(true);
              setMsg(null);
              setStep("details");
            }}
            onNo={() => {
              setExistingConfirmed(false);
              setExistingMatch(null);
              setStep("student");
              setMsgTone("error");
              setMsg(dict.existingRejected);
            }}
          />
        ) : null}
        {step === "details" ? (
          <RegisterFormContactAndSections
            dict={dict}
            busy={busy}
            showTutor={showTutor}
            showAdultContact={showAdultContact}
            sectionOptions={sectionOptions}
            selectedSectionIds={selectedSectionIds}
            onSelectedSectionIdsChange={setSelectedSectionIds}
            enrollmentLink={enrollmentLink}
          />
        ) : null}
        {msg ? (
          <p
            className={msgTone === "muted" ? "text-sm text-[var(--color-muted-foreground)]" : "text-sm text-[var(--color-error)]"}
            role="alert"
          >
            {msg}
          </p>
        ) : null}
      </form>
    </>
  );
}
