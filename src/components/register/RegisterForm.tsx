"use client";

import { UserPlus } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { submitSectionLinkRegistration } from "@/app/[locale]/i/[token]/actions";
import { submitPublicRegistration } from "@/app/[locale]/register/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { RegisterBirthDateDayPicker } from "@/components/molecules/RegisterBirthDateDayPicker";
import { RegisterSuccessDialog } from "@/components/molecules/RegisterSuccessDialog";
import { RegisterTutorFieldset } from "@/components/register/RegisterTutorFieldset";
import { SectionEnrollmentLinkCard } from "@/components/register/SectionEnrollmentLinkCard";
import { REGISTER_NATIVE_SELECT_CN } from "@/components/register/registerFormNativeSelectCn";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import type { PublicRegistrationInput } from "@/lib/register/publicRegistrationSchema";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { Dictionary } from "@/types/i18n";

interface RegisterFormProps {
  locale: string;
  dict: Dictionary["register"];
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  /**
   * Present only on `/[locale]/i/[token]`. Fixes the section, hides the picker and
   * routes the submit through the token-scoped action. Absent on `/register`.
   */
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
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"error" | "muted">("error");
  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [birthDate, setBirthDate] = useState("");

  const showTutor =
    birthDate.length === 10 && fullYearsFromIsoDate(birthDate) < legalAgeMajority;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
        setBirthDate("");
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
        <div>
          <Label htmlFor="rg-fn" required>{dict.firstName}</Label>
          <Input id="rg-fn" name="first_name" required autoComplete="given-name" className="mt-1 w-full" />
        </div>
        <div>
          <Label htmlFor="rg-ln" required>{dict.lastName}</Label>
          <Input id="rg-ln" name="last_name" required autoComplete="family-name" className="mt-1 w-full" />
        </div>
        <input type="hidden" name="birth_date" value={birthDate} readOnly aria-hidden />
        <RegisterBirthDateDayPicker
          locale={locale}
          birthDateLegendRequired
          labels={{
            birthDate: dict.birthDate,
            birthMonth: dict.birthMonth,
            birthYear: dict.birthYear,
            birthDay: dict.birthDay,
            birthDayPlaceholder: dict.birthDayPlaceholder,
            birthDateHint: dict.birthDateHint,
            birthDatePickPrompt: dict.birthDatePickPrompt,
            birthDatePickedAnnouncement: dict.birthDatePickedAnnouncement,
          }}
          value={birthDate}
          onChange={setBirthDate}
        />
        <div>
          <Label htmlFor="rg-dni" required>{dict.dni}</Label>
          <Input id="rg-dni" name="dni" required autoComplete="off" className="mt-1 w-full" />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.documentIdFormatHint}</p>
        </div>
        {showTutor ? (
          <p className="text-xs text-[var(--color-muted-foreground)]" role="note">
            {dict.studentEmailNotCollectedMinorLead}
          </p>
        ) : null}
        {!showTutor ? (
          <>
            <div>
              <Label htmlFor="rg-em" required>{dict.email}</Label>
              <Input id="rg-em" name="email" type="email" required autoComplete="email" className="mt-1 w-full" />
            </div>
            <div>
              <Label htmlFor="rg-ph" required>{dict.phone}</Label>
              <Input id="rg-ph" name="phone" required autoComplete="tel" className="mt-1 w-full" />
            </div>
          </>
        ) : (
          <>
            <input type="hidden" name="email" value="" />
            <input type="hidden" name="phone" value="" readOnly aria-hidden />
          </>
        )}
        {showTutor ? <RegisterTutorFieldset dict={dict} required={showTutor} /> : null}
        {enrollmentLink ? (
          <>
            <input
              type="hidden"
              name="preferred_section_id"
              value={enrollmentLink.sectionId}
              readOnly
              aria-hidden
            />
            <SectionEnrollmentLinkCard
              link={enrollmentLink}
              labels={dict.sectionLink}
            />
          </>
        ) : (
          <>
            {sectionOptions.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
                {dict.noSectionsAvailable}
              </p>
            ) : null}
            <div>
              <Label htmlFor="rg-section" required>{dict.level}</Label>
              <select
                id="rg-section"
                name="preferred_section_id"
                required
                className={`mt-1 ${REGISTER_NATIVE_SELECT_CN}`}
                defaultValue=""
              >
                <option value="" disabled>
                  {dict.sectionPlaceholder}
                </option>
                <option value={REGISTRATION_UNDECIDED_FORM_VALUE}>
                  {dict.sectionUndecidedOption}
                </option>
                {sectionOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {dict.sectionUndecidedHint}
              </p>
            </div>
          </>
        )}
        <Button type="submit" disabled={busy} isLoading={busy}>
          {!busy ? <UserPlus className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {dict.submit}
        </Button>
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
