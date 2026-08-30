"use client";

import { type FormEvent, useRef, useState } from "react";
import { submitSectionLinkRegistration } from "@/app/[locale]/i/actions";
import { submitPublicRegistration } from "@/app/[locale]/register/actions";
import { lookupRegistrationStudentAction } from "@/app/[locale]/register/lookupRegistrationStudentAction";
import { Button } from "@/components/atoms/Button";
import { RegisterExistingStudentConfirm } from "@/components/register/RegisterExistingStudentConfirm";
import { RegisterFormContactAndSections } from "@/components/register/RegisterFormContactAndSections";
import { RegisterStudentFieldset } from "@/components/register/RegisterStudentFieldset";
import { RegisterSuccessDialog } from "@/components/molecules/RegisterSuccessDialog";
import { SectionEnrollmentLinkCard } from "@/components/register/SectionEnrollmentLinkCard";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { Dictionary } from "@/types/i18n";
import type { RegistrationExtrasPackId } from "@/lib/register/packs/extrasPackForTemplateKind";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import { RegisterNagoExtras } from "@/components/register/RegisterNagoExtras";
import { collectRegisterExtrasPrefill } from "@/lib/register/packs/nago/collectRegisterExtrasPrefill";
import { publicRegistrationInputFromFormData } from "@/lib/register/publicRegistrationInputFromFormData";

type RegisterStep = "student" | "confirm" | "details" | "extras";

interface RegisterFormProps {
  locale: string;
  dict: Dictionary["register"];
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
  extrasPack?: RegistrationExtrasPackId | null;
  intent?: RegisterIntent;
}

export function RegisterForm({
  locale,
  dict,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
  extrasPack = null,
  intent = "reserve",
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
  const [tutorPrefill, setTutorPrefill] = useState<
    ReturnType<typeof collectRegisterExtrasPrefill>["tutorPrefill"] | null
  >(null);
  const [signerPrefill, setSignerPrefill] = useState({ name: "", dni: "" });

  const formDict = intent === "trial" ? { ...dict, submit: dict.trial.submit } : dict;
  const isMinor = birthDate.length === 10 && fullYearsFromIsoDate(birthDate) < legalAgeMajority;
  const onLaterStep = step === "details" || step === "extras";
  const showTutor = onLaterStep && !existingConfirmed && isMinor;
  const showAdultContact = onLaterStep && !existingConfirmed && !isMinor;

  function resetOutcome() {
    setSuccessOpen(false);
    setBirthDate("");
    setStep("student");
    setExistingMatch(null);
    setExistingConfirmed(false);
    setSelectedSectionIds([]);
    setTutorPrefill(null);
    setSignerPrefill({ name: "", dni: "" });
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
    if (step !== "details" && step !== "extras") return;
    if (birthDate.length !== 10) {
      setMsgTone("error");
      setMsg(dict.birthDateIncomplete);
      return;
    }
    setBusy(true);
    setMsg(null);
    setMsgTone("error");
    const raw = publicRegistrationInputFromFormData(
      new FormData(e.currentTarget),
      extrasPack,
      intent,
    );
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
        className="w-full min-w-0 max-w-2xl space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-primary)]/[0.06]"
      >
        <input type="hidden" name="intent" value={intent} />
        <RegisterStudentFieldset
          locale={locale}
          dict={formDict}
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
        {step === "details" || step === "extras" ? (
          <RegisterFormContactAndSections
            locale={locale}
            dict={formDict}
            busy={busy}
            showTutor={showTutor}
            showAdultContact={showAdultContact}
            sectionOptions={sectionOptions}
            selectedSectionIds={selectedSectionIds}
            onSelectedSectionIdsChange={setSelectedSectionIds}
            enrollmentLink={enrollmentLink}
            intent={intent}
            hidden={step === "extras"}
            submitType={extrasPack === "nago" && step === "details" ? "button" : "submit"}
            onContinue={() => {
              const form = formRef.current;
              if (!form?.reportValidity()) return;
              const prefill = collectRegisterExtrasPrefill(form, {
                isMinor,
                existingConfirmed,
              });
              setTutorPrefill(prefill.tutorPrefill);
              setSignerPrefill(prefill.signerPrefill);
              setStep("extras");
            }}
          />
        ) : null}
        {step === "extras" && extrasPack === "nago" ? (
          <RegisterNagoExtras
            dict={dict}
            isMinor={isMinor}
            busy={busy}
            showUseTutor={Boolean(showTutor && tutorPrefill?.name)}
            tutorPrefill={tutorPrefill}
            signerPrefill={signerPrefill}
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
