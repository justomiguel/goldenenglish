import type { FormEvent } from "react";
import { submitSectionLinkRegistration } from "@/app/[locale]/i/actions";
import { submitPublicRegistration } from "@/app/[locale]/register/actions";
import { lookupRegistrationStudentAction } from "@/app/[locale]/register/lookupRegistrationStudentAction";
import type { RegisterTutorPrefillValues } from "@/components/register/RegisterTutorFieldset";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { RegistrationExtrasPackId } from "@/lib/register/packs/extrasPackForTemplateKind";
import { publicRegistrationInputFromFormData } from "@/lib/register/publicRegistrationInputFromFormData";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import type { Dictionary } from "@/types/i18n";

type RegisterDict = Dictionary["register"];
type RegisterStep = "dni" | "details" | "extras";

export async function continueRegistrationDni(input: {
  form: HTMLFormElement | null;
  dni: string;
  dict: RegisterDict;
  setBusy: (value: boolean) => void;
  setMsg: (value: string | null) => void;
  setMsgTone: (value: "error" | "muted") => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setBirthDate: (value: string) => void;
  setDefaultEmail: (value: string) => void;
  setDefaultPhone: (value: string) => void;
  setTutorDefaults: (value: RegisterTutorPrefillValues | null) => void;
  setExistingMatch: (value: { firstName: string; lastName: string } | null) => void;
  setExistingConfirmed: (value: boolean) => void;
  setStep: (value: RegisterStep) => void;
}): Promise<void> {
  if (!input.form || !input.form.reportValidity()) return;
  input.setBusy(true);
  input.setMsg(null);
  input.setMsgTone("error");
  try {
    const lookup = await lookupRegistrationStudentAction(input.dni);
    if (!lookup.ok) {
      input.setMsg(input.dict.lookupFailed);
      return;
    }
    if (lookup.found) {
      input.setFirstName(lookup.firstName ?? "");
      input.setLastName(lookup.lastName ?? "");
      input.setBirthDate(lookup.birthDate ?? "");
      input.setDefaultEmail(lookup.email ?? "");
      input.setDefaultPhone(lookup.phone ?? "");
      input.setTutorDefaults({
        name: lookup.tutorName ?? "",
        dni: lookup.tutorDni ?? "",
        email: lookup.tutorEmail ?? "",
        phone: lookup.tutorPhone ?? "",
        relationship: lookup.tutorRelationship ?? "",
      });
      input.setExistingMatch({ firstName: lookup.firstName, lastName: lookup.lastName });
      input.setExistingConfirmed(true);
      input.setStep("details");
      return;
    }
    input.setExistingMatch(null);
    input.setExistingConfirmed(false);
    input.setTutorDefaults(null);
    input.setStep("details");
  } finally {
    input.setBusy(false);
  }
}

export async function submitRegistrationForm(
  e: FormEvent<HTMLFormElement>,
  input: {
    step: RegisterStep;
    birthDate: string;
    dict: RegisterDict;
    locale: string;
    extrasPack: RegistrationExtrasPackId | null;
    intent: RegisterIntent;
    enrollmentLink?: SectionEnrollmentLinkContext;
    form: HTMLFormElement | null;
    setBusy: (value: boolean) => void;
    setMsg: (value: string | null) => void;
    setMsgTone: (value: "error" | "muted") => void;
    resetOutcome: () => void;
    setSuccessOpen: (value: boolean) => void;
    onRegistered?: () => void;
  },
): Promise<void> {
  e.preventDefault();
  if (input.step !== "details" && input.step !== "extras") return;
  if (input.birthDate.length !== 10) {
    input.setMsgTone("error");
    input.setMsg(input.dict.birthDateIncomplete);
    return;
  }
  input.setBusy(true);
  input.setMsg(null);
  input.setMsgTone("error");
  const raw = publicRegistrationInputFromFormData(
    new FormData(e.currentTarget),
    input.extrasPack,
    input.intent,
  );
  try {
    const res = input.enrollmentLink
      ? await submitSectionLinkRegistration(input.locale, input.enrollmentLink.token, raw)
      : await submitPublicRegistration(input.locale, raw);
    if (res.ok) {
      input.form?.reset();
      input.resetOutcome();
      input.setSuccessOpen(true);
      input.onRegistered?.();
      return;
    }
    const closed = res.message === input.dict.closed;
    input.setMsgTone(closed ? "muted" : "error");
    input.setMsg(closed ? input.dict.closed : res.message?.trim() || input.dict.error);
  } finally {
    input.setBusy(false);
  }
}
