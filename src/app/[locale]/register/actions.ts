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
import { createAdminClient } from "@/lib/supabase/admin";
import { parseRequestedSectionIds } from "@/lib/register/parseRequestedSectionIds";
import { resolveExistingStudentByDni } from "@/lib/register/resolveExistingStudentByDni";
import { resolveAndStampTenantExtras } from "@/lib/register/packs/resolveAndStampTenantExtras";
import {
  notifyPublicRegistrationReceived,
  quotePublicRegistrationFee,
} from "@/lib/register/completePublicRegistrationSubmit";

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

  const candidateIds = [
    d.preferred_section_id,
    ...(d.additional_section_ids ?? []),
  ].filter((id) => id && id !== REGISTRATION_UNDECIDED_FORM_VALUE);

  const validPublicIds: string[] = [];
  for (const id of candidateIds) {
    const { data: sectionLabel, error: sectionRpcErr } = await supabase.rpc(
      "registration_public_section_label",
      { p_section_id: id },
    );
    if (!sectionRpcErr && sectionLabel != null && String(sectionLabel).trim() !== "") {
      if (!validPublicIds.includes(id)) validPublicIds.push(id);
    }
  }

  const parsedSections = parseRequestedSectionIds({
    selectedIds: [d.preferred_section_id, ...(d.additional_section_ids ?? [])],
    sectionOptionsOrder: validPublicIds,
    allowUndecided: true,
  });
  if (!parsedSections.ok) {
    return { ok: false, message: reg.validationError };
  }

  let sectionLabelForRow: string | null = null;
  const preferredSectionId = parsedSections.preferredSectionId;
  const additionalSectionIds = parsedSections.additionalSectionIds;

  if (parsedSections.undecided) {
    sectionLabelForRow = REGISTRATION_LEVEL_INTEREST_UNDECIDED;
  } else if (preferredSectionId) {
    const { data: sectionLabel, error: sectionRpcErr } = await supabase.rpc(
      "registration_public_section_label",
      { p_section_id: preferredSectionId },
    );
    if (
      sectionRpcErr ||
      sectionLabel == null ||
      String(sectionLabel).trim() === ""
    ) {
      return { ok: false, message: reg.invalidSectionOption };
    }
    sectionLabelForRow = String(sectionLabel);
  } else if (candidateIds.length > 0) {
    return { ok: false, message: reg.invalidSectionOption };
  }

  const identity = await resolveExistingStudentByDni(createAdminClient(), d.dni);
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
    ? getRegistrationMailTenantDomain()
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

  const quote = await quotePublicRegistrationFee({
    supabase,
    admin: createAdminClient(),
    sectionIds: [preferredSectionId, ...additionalSectionIds].filter(
      (id): id is string => Boolean(id),
    ),
    nowIso: new Date().toISOString(),
  });
  if (!quote.ok) {
    return { ok: false, message: reg.sectionFilledUp };
  }

  const maxMinorEmailAttempts = 16;
  const maxAttempts = existingStudent ? 1 : age < legal ? maxMinorEmailAttempts : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let resolvedEmail: string;
    if (existingStudent) {
      resolvedEmail = identity.email;
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
      phone: existingStudent || age < legal ? null : d.phone.trim(),
      birth_date: d.birth_date,
      preferred_section_id: preferredSectionId,
      additional_section_ids: additionalSectionIds,
      level_interest: sectionLabelForRow,
      status: "new",
      tutor_name: existingStudent ? null : d.tutor_name?.trim() || null,
      tutor_dni: existingStudent ? null : d.tutor_dni?.trim() || null,
      tutor_phone: existingStudent ? null : d.tutor_phone?.trim() || null,
      tutor_email: existingStudent ? null : d.tutor_email?.trim() || null,
      tutor_relationship: existingStudent ? null : d.tutor_relationship?.trim() || null,
      tenant_extras: stamped.extras,
      pay_token: quote.fields.pay_token,
      fee_snapshot: quote.fields.fee_snapshot,
      intake_state: quote.fields.intake_state,
      fee_captured: quote.fields.fee_captured,
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
