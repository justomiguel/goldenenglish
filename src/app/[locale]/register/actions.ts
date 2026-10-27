"use server";

import { revalidatePath } from "next/cache";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { createClient } from "@/lib/supabase/server";
import {
  buildPublicRegistrationSchema,
  type PublicRegistrationFormDraft,
} from "@/lib/register/publicRegistrationSchema";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { composeSyntheticMinorStudentEmail } from "@/lib/register/composeSyntheticMinorStudentEmail";
import { getRequestMailTenantDomain } from "@/lib/register/requestMailTenant";
import { randomLowercaseAlphaString } from "@/lib/server/randomLowercaseAlphaString";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePublicRegistrationSections } from "@/lib/register/resolvePublicRegistrationSections";
import { resolveExistingStudentByDni } from "@/lib/register/resolveExistingStudentByDni";
import { resolveAndStampTenantExtras } from "@/lib/register/packs/resolveAndStampTenantExtras";
import {
  notifyPublicRegistrationReceived,
  quotePublicRegistrationFee,
} from "@/lib/register/completePublicRegistrationSubmit";
import { completeTrialRegistrationSubmit } from "@/lib/register/completeTrialRegistrationSubmit";
import { privacyAcceptanceStamp } from "@/lib/privacy/privacyAcceptanceStamp";
import type { RegisterActionState } from "@/lib/register/registerActionState";
export async function submitPublicRegistration(
  locale: string,
  raw: PublicRegistrationFormDraft,
): Promise<RegisterActionState> {
  const dict = await getDictionary(locale);
  const reg = dict.register;

  if (!(await getInscriptionsEnabled())) {
    return { ok: false, message: reg.closed };
  }

  const legal = getLegalAgeMajorityFromSystem();
  const parsed = buildPublicRegistrationSchema(legal, {
    requireNewStudentContact: false,
  }).safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: reg.validationError };
  }

  const d = parsed.data;
  const age = fullYearsFromIsoDate(d.birth_date);
  const tutorMail = (d.tutor_email ?? "").trim().toLowerCase();

  const supabase = await createClient();

  const sections = await resolvePublicRegistrationSections(supabase, d, {
    invalid: reg.invalidSectionOption,
    validation: reg.validationError,
  });
  if (!sections.ok) return sections;
  const { sectionLabelForRow, preferredSectionId, additionalSectionIds } = sections;

  const identity = await resolveExistingStudentByDni(await createAdminClient(), d.dni);
  if (identity.kind === "occupied") {
    return { ok: false, message: reg.documentInUse };
  }
  const existingStudent = identity.kind === "student";
  if (existingStudent && !identity.email) {
    return { ok: false, message: reg.documentInUse };
  }
  if (!existingStudent) {
    const contact = buildPublicRegistrationSchema(legal).safeParse(raw);
    if (!contact.success) {
      return { ok: false, message: reg.validationError };
    }
  }

  const tenantDomain = !existingStudent && age < legal
    ? await getRequestMailTenantDomain()
    : null;
  if (!existingStudent && age < legal && !tenantDomain) {
    return {
      ok: false,
      message: dict.actionErrors.register.mailTenantMissing,
    };
  }

  const stamped = await resolveAndStampTenantExtras({
    raw: d.tenant_extras,
    isMinor: age < legal,
    nowIso: new Date().toISOString(),
  });
  if (!stamped.ok) {
    return { ok: false, message: reg.validationError };
  }

  if (d.intent === "trial") {
    const trial = await completeTrialRegistrationSubmit({
      locale, dict, supabase, admin: await createAdminClient(), parsed: d,
      identity, extras: stamped.extras, age, legal,
    });
    if (trial.ok) revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
    return trial;
  }

  const quote = await quotePublicRegistrationFee({
    supabase,
    admin: await createAdminClient(),
    sectionIds: [preferredSectionId, ...additionalSectionIds].filter(
      (id): id is string => Boolean(id),
    ),
    nowIso: new Date().toISOString(),
    dni: d.dni,
  });
  if (!quote.ok) {
    return { ok: false, message: reg.sectionFilledUp };
  }

  const maxMinorEmailAttempts = 16;
  const maxAttempts = existingStudent ? 1 : age < legal ? maxMinorEmailAttempts : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let resolvedEmail: string;
    if (existingStudent) {
      const candidateEmail = d.email.trim().toLowerCase();
      resolvedEmail =
        age >= legal && candidateEmail.includes("@") ? candidateEmail : identity.email;
    } else if (age < legal) {
      if (attempt === 0) {
        resolvedEmail = composeSyntheticMinorStudentEmail(
          d.first_name,
          d.last_name,
          d.dni,
          tenantDomain!,
        ).toLowerCase();
      } else {
        const suffixLen = Math.min(2 + attempt, 10);
        resolvedEmail = composeSyntheticMinorStudentEmail(
          d.first_name,
          d.last_name,
          d.dni,
          tenantDomain!,
          { coreSuffix: randomLowercaseAlphaString(suffixLen) },
        ).toLowerCase();
      }
    } else {
      resolvedEmail = d.email.trim().toLowerCase();
    }

    if (!existingStudent && age < legal && tutorMail && tutorMail === resolvedEmail) {
      return {
        ok: false,
        message: reg.tutorEmailSameAsStudent,
      };
    }

    const { error } = await supabase.from("registrations").insert({
      first_name: d.first_name,
      last_name: d.last_name,
      dni: d.dni,
      email: resolvedEmail,
      phone: age < legal ? null : d.phone.trim() || null,
      birth_date: d.birth_date,
      preferred_section_id: preferredSectionId,
      additional_section_ids: additionalSectionIds,
      level_interest: sectionLabelForRow,
      status: "new",
      tutor_name: d.tutor_name?.trim() || null,
      tutor_dni: d.tutor_dni?.trim() || null,
      tutor_phone: d.tutor_phone?.trim() || null,
      tutor_email: d.tutor_email?.trim() || null,
      tutor_relationship: d.tutor_relationship?.trim() || null,
      tenant_extras: stamped.extras,
      pay_token: quote.fields.pay_token,
      fee_snapshot: quote.fields.fee_snapshot,
      intake_state: quote.fields.intake_state,
      fee_captured: quote.fields.fee_captured,
      ...privacyAcceptanceStamp(),
    });

    if (!error) {
      revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
      void notifyPublicRegistrationReceived({
        locale,
        dict,
        isMinor: age < legal,
        studentFirstName: d.first_name,
        studentLastName: d.last_name,
        studentEmail: resolvedEmail,
        tutorName: existingStudent ? null : d.tutor_name?.trim() || null,
        tutorEmail: existingStudent ? null : d.tutor_email?.trim() || null,
        sectionLabel: sectionLabelForRow,
        payToken: quote.fields.pay_token,
        snapshotTotal: quote.fields.fee_snapshot.total,
        snapshotCurrency: quote.fields.fee_snapshot.currency,
        feeSnapshot: quote.fields.fee_snapshot,
      });
      return { ok: true };
    }

    const isUniqueViolation = error.code === "23505";
    if (age < legal && isUniqueViolation && attempt < maxAttempts - 1) {
      continue;
    }

    return { ok: false, message: dict.actionErrors.register.insertFailed };
  }

  return { ok: false, message: dict.actionErrors.register.insertFailed };
}
