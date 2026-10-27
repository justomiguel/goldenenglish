"use client";

import { useRef, useState } from "react";
import {
  continueRegistrationDni,
  submitRegistrationForm,
} from "@/components/register/registerFormHandlers";
import { RegisterDniStep } from "@/components/register/RegisterDniStep";
import { RegisterFormAfterDni } from "@/components/register/RegisterFormAfterDni";
import type { RegisterTutorPrefillValues } from "@/components/register/RegisterTutorFieldset";
import { RegisterSuccessDialog } from "@/components/molecules/RegisterSuccessDialog";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { Dictionary } from "@/types/i18n";
import type { RegistrationExtrasPackId } from "@/lib/register/packs/extrasPackForTemplateKind";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import { collectRegisterExtrasPrefill } from "@/lib/register/packs/nago/collectRegisterExtrasPrefill";

const PUBLIC_FORM_CLASS =
  "w-full min-w-0 space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-primary)]/[0.06]";
const EMBEDDED_FORM_CLASS = "w-full min-w-0 space-y-4";
type RegisterStep = "dni" | "details" | "extras";

interface RegisterFormProps {
  locale: string;
  dict: Dictionary["register"];
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
  extrasPack?: RegistrationExtrasPackId | null;
  intent?: RegisterIntent;
  embedded?: boolean;
  onRegistered?: () => void;
  onLeave?: () => void;
}

export function RegisterForm({
  locale,
  dict,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
  extrasPack = null,
  intent = "reserve",
  embedded = false,
  onRegistered,
  onLeave,
}: RegisterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<RegisterStep>("dni");
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"error" | "muted">("error");
  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [dni, setDni] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [defaultEmail, setDefaultEmail] = useState("");
  const [defaultPhone, setDefaultPhone] = useState("");
  const [tutorDefaults, setTutorDefaults] = useState<RegisterTutorPrefillValues | null>(null);
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
  const showTutor = onLaterStep && isMinor;
  const showAdultContact = onLaterStep && !isMinor;

  function resetOutcome() {
    setSuccessOpen(false);
    setDni("");
    setFirstName("");
    setLastName("");
    setBirthDate("");
    setDefaultEmail("");
    setDefaultPhone("");
    setTutorDefaults(null);
    setStep("dni");
    setExistingMatch(null);
    setExistingConfirmed(false);
    setSelectedSectionIds([]);
    setTutorPrefill(null);
    setSignerPrefill({ name: "", dni: "" });
  }

  function onContinueDni() {
    return continueRegistrationDni({
      form: formRef.current,
      dni,
      dict,
      setBusy,
      setMsg,
      setMsgTone,
      setFirstName,
      setLastName,
      setBirthDate,
      setDefaultEmail,
      setDefaultPhone,
      setTutorDefaults,
      setExistingMatch,
      setExistingConfirmed,
      setStep,
    });
  }

  function onSubmit(e: Parameters<typeof submitRegistrationForm>[0]) {
    return submitRegistrationForm(e, {
      step,
      birthDate,
      dict,
      locale,
      extrasPack,
      intent,
      enrollmentLink,
      form: formRef.current,
      setBusy,
      setMsg,
      setMsgTone,
      resetOutcome,
      setSuccessOpen,
      onRegistered,
    });
  }

  const existingLeadText = existingMatch
    ? (dict.existingPrefilledNotice ?? dict.existingFoundLead)
        .replace("{firstName}", existingMatch.firstName)
        .replace("{lastName}", existingMatch.lastName)
    : "";

  return (
    <>
      <RegisterSuccessDialog
        locale={locale}
        open={successOpen}
        onOpenChange={setSuccessOpen}
        dict={dict}
        onHome={onLeave}
      />
      <form
        ref={formRef}
        onSubmit={onSubmit}
        data-extras-pack={extrasPack ?? "none"}
        className={embedded ? EMBEDDED_FORM_CLASS : PUBLIC_FORM_CLASS}
      >
        <input type="hidden" name="intent" value={intent} />
        {step === "dni" ? (
          <RegisterDniStep
            dict={formDict}
            dni={dni}
            onDniChange={setDni}
            busy={busy}
            enrollmentLink={enrollmentLink}
            onContinue={() => void onContinueDni()}
          />
        ) : (
          <RegisterFormAfterDni
            locale={locale}
            dict={dict}
            formDict={formDict}
            dni={dni}
            onDniChange={setDni}
            firstName={firstName}
            onFirstNameChange={setFirstName}
            lastName={lastName}
            onLastNameChange={setLastName}
            birthDate={birthDate}
            onBirthDateChange={setBirthDate}
            existingMatch={existingMatch}
            existingLeadText={existingLeadText}
            busy={busy}
            showTutor={showTutor}
            showAdultContact={showAdultContact}
            contactRequired={!existingConfirmed}
            defaultEmail={defaultEmail}
            defaultPhone={defaultPhone}
            tutorDefaults={tutorDefaults}
            sectionOptions={sectionOptions}
            selectedSectionIds={selectedSectionIds}
            onSelectedSectionIdsChange={setSelectedSectionIds}
            enrollmentLink={enrollmentLink}
            intent={intent}
            step={step}
            extrasPack={extrasPack}
            isMinor={isMinor}
            tutorPrefill={tutorPrefill}
            signerPrefill={signerPrefill}
            onBackToDetails={() => setStep("details")}
            onContinueToExtras={() => {
              if (birthDate.length !== 10) {
                setMsgTone("error");
                setMsg(dict.birthDateIncomplete);
                return;
              }
              const form = formRef.current;
              if (!form?.reportValidity()) return;
              const prefill = collectRegisterExtrasPrefill(form, {
                isMinor,
                existingConfirmed: false,
              });
              setTutorPrefill(prefill.tutorPrefill);
              setSignerPrefill(prefill.signerPrefill);
              setStep("extras");
            }}
          />
        )}
        {msg ? (
          <p
            className={
              msgTone === "muted"
                ? "text-sm text-[var(--color-muted-foreground)]"
                : "text-sm text-[var(--color-error)]"
            }
            role="alert"
          >
            {msg}
          </p>
        ) : null}
      </form>
    </>
  );
}
