"use server";

import { revalidatePath } from "next/cache";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { createClient } from "@/lib/supabase/server";
import {
  buildPublicRegistrationSchema,
  type PublicRegistrationInput,
} from "@/lib/register/publicRegistrationSchema";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { composeSyntheticMinorStudentEmail } from "@/lib/register/composeSyntheticMinorStudentEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { randomLowercaseAlphaString } from "@/lib/server/randomLowercaseAlphaString";
import {
  REGISTRATION_LEVEL_INTEREST_UNDECIDED,
  REGISTRATION_UNDECIDED_FORM_VALUE,
} from "@/lib/register/registrationSectionConstants";

export type RegisterActionState = { ok: boolean; message?: string };

export async function submitPublicRegistration(
  locale: string,
  raw: PublicRegistrationInput,
): Promise<RegisterActionState> {
  const dict = await getDictionary(locale);
  const reg = dict.register;

  if (!(await getInscriptionsEnabled())) {
    return { ok: false, message: reg.closed };
  }

  const parsed = buildPublicRegistrationSchema(
    getLegalAgeMajorityFromSystem(),
  ).safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: reg.validationError };
  }

  const d = parsed.data;
  const legal = getLegalAgeMajorityFromSystem();
  const age = fullYearsFromIsoDate(d.birth_date);
  const tutorMail = (d.tutor_email ?? "").trim().toLowerCase();

  const tenantDomain = age < legal ? getRegistrationMailTenantDomain() : null;
  if (age < legal && !tenantDomain) {
    return {
      ok: false,
      message: dict.actionErrors.register.mailTenantMissing,
    };
  }

  const supabase = await createClient();

  const isUndecided = d.preferred_section_id === REGISTRATION_UNDECIDED_FORM_VALUE;
  let sectionLabelForRow: string | null = null;
  let preferredSectionId: string | null = null;

  if (isUndecided) {
    sectionLabelForRow = REGISTRATION_LEVEL_INTEREST_UNDECIDED;
    preferredSectionId = null;
  } else {
    const { data: sectionLabel, error: sectionRpcErr } = await supabase.rpc(
      "registration_public_section_label",
      { p_section_id: d.preferred_section_id },
    );
    if (
      sectionRpcErr ||
      sectionLabel == null ||
      String(sectionLabel).trim() === ""
    ) {
      return { ok: false, message: reg.invalidSectionOption };
    }
    sectionLabelForRow = String(sectionLabel);
    preferredSectionId = d.preferred_section_id;
  }

  const maxMinorEmailAttempts = 16;
  const maxAttempts = age < legal ? maxMinorEmailAttempts : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let resolvedEmail: string;
    if (age < legal) {
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

    if (age < legal && tutorMail && tutorMail === resolvedEmail) {
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
      phone: age < legal ? null : d.phone.trim(),
      birth_date: d.birth_date,
      preferred_section_id: preferredSectionId,
      level_interest: sectionLabelForRow,
      status: "new",
      tutor_name: d.tutor_name?.trim() || null,
      tutor_dni: d.tutor_dni?.trim() || null,
      tutor_phone: d.tutor_phone?.trim() || null,
      tutor_email: d.tutor_email?.trim() || null,
      tutor_relationship: d.tutor_relationship?.trim() || null,
    });

    if (!error) {
      revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
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
