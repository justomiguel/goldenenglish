"use server";

import { revalidatePath } from "next/cache";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { createClient } from "@/lib/supabase/server";
import {
  buildPublicRegistrationSchema,
  type PublicRegistrationInput,
} from "@/lib/register/publicRegistrationSchema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { composeSyntheticMinorStudentEmail } from "@/lib/register/composeSyntheticMinorStudentEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { randomLowercaseAlphaString } from "@/lib/server/randomLowercaseAlphaString";
import { isSectionEnrollmentLinkToken } from "@/lib/register/sectionEnrollmentLink";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { RegisterActionState } from "@/app/[locale]/register/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseRequestedSectionIds } from "@/lib/register/parseRequestedSectionIds";
import { resolveExistingStudentByDni } from "@/lib/register/resolveExistingStudentByDni";
import { resolveAndStampTenantExtras } from "@/lib/register/packs/resolveAndStampTenantExtras";

type ResolvedRow = {
  section_id?: string | null;
  section_name?: string | null;
  cohort_name?: string | null;
};

/**
 * Public submission through a section enrollment link.
 *
 * Mirrors `submitPublicRegistration` but takes its authorization from the token
 * instead of the `inscriptions_enabled` setting, and derives the section from the
 * server-side resolution — never from the client payload.
 */
export async function submitSectionLinkRegistration(
  locale: string,
  token: string,
  raw: PublicRegistrationInput,
): Promise<RegisterActionState> {
  const dict = await getDictionary(locale);
  const reg = dict.register;

  if (!isSectionEnrollmentLinkToken(token)) {
    return { ok: false, message: reg.sectionLink.unavailableClosed };
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

  const { data: resolved, error: resolveErr } = await supabase.rpc(
    "resolve_section_enrollment_link",
    { p_token: token },
  );
  if (resolveErr) {
    logSupabaseClientError("submitSectionLinkRegistration:resolve", resolveErr);
    return { ok: false, message: reg.sectionLink.unavailableClosed };
  }

  const row = (Array.isArray(resolved) ? resolved[0] : resolved) as
    | ResolvedRow
    | null
    | undefined;
  if (!row?.section_id) {
    return { ok: false, message: reg.sectionLink.unavailableClosed };
  }

  const sectionId = String(row.section_id);
  const sectionLabel = [row.cohort_name, row.section_name]
    .filter((part) => String(part ?? "").trim() !== "")
    .join(" — ");

  const extraCandidates = (d.additional_section_ids ?? []).filter((id) => id !== sectionId);
  const validExtras: string[] = [];
  for (const id of extraCandidates) {
    const { data: extraLabel, error: extraErr } = await supabase.rpc(
      "registration_public_section_label",
      { p_section_id: id },
    );
    if (!extraErr && extraLabel != null && String(extraLabel).trim() !== "") {
      if (!validExtras.includes(id)) validExtras.push(id);
    }
  }
  const parsedSections = parseRequestedSectionIds({
    selectedIds: extraCandidates,
    sectionOptionsOrder: validExtras,
    lockedPreferredId: sectionId,
    allowUndecided: false,
  });
  if (!parsedSections.ok) {
    return { ok: false, message: reg.validationError };
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
    return { ok: false, message: dict.actionErrors.register.mailTenantMissing };
  }

  const stamped = await resolveAndStampTenantExtras({
    raw: d.tenant_extras,
    isMinor: age < legal,
    nowIso: new Date().toISOString(),
  });
  if (!stamped.ok) {
    return { ok: false, message: reg.validationError };
  }

  const maxMinorEmailAttempts = 16;
  const maxAttempts = existingStudent ? 1 : age < legal ? maxMinorEmailAttempts : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let resolvedEmail: string;
    if (existingStudent) {
      resolvedEmail = identity.email;
    } else if (age < legal) {
      /** No options on the first attempt, so the address matches the public form's. */
      const coreSuffix =
        attempt === 0
          ? undefined
          : randomLowercaseAlphaString(Math.min(2 + attempt, 10));
      resolvedEmail = composeSyntheticMinorStudentEmail(
        d.first_name,
        d.last_name,
        d.dni,
        tenantDomain!,
        coreSuffix ? { coreSuffix } : undefined,
      ).toLowerCase();
    } else {
      resolvedEmail = d.email.trim().toLowerCase();
    }

    if (!existingStudent && age < legal && tutorMail && tutorMail === resolvedEmail) {
      return { ok: false, message: reg.tutorEmailSameAsStudent };
    }

    const { error } = await supabase.from("registrations").insert({
      first_name: d.first_name,
      last_name: d.last_name,
      dni: d.dni,
      email: resolvedEmail,
      phone: existingStudent || age < legal ? null : d.phone.trim(),
      birth_date: d.birth_date,
      preferred_section_id: sectionId,
      additional_section_ids: parsedSections.additionalSectionIds,
      source_section_link_id: sectionId,
      level_interest: sectionLabel || null,
      status: "new",
      tutor_name: existingStudent ? null : d.tutor_name?.trim() || null,
      tutor_dni: existingStudent ? null : d.tutor_dni?.trim() || null,
      tutor_phone: existingStudent ? null : d.tutor_phone?.trim() || null,
      tutor_email: existingStudent ? null : d.tutor_email?.trim() || null,
      tutor_relationship: existingStudent ? null : d.tutor_relationship?.trim() || null,
      tenant_extras: stamped.extras,
    });

    if (!error) {
      revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
      return { ok: true };
    }

    const isUniqueViolation = error.code === "23505";
    if (age < legal && isUniqueViolation && attempt < maxAttempts - 1) {
      continue;
    }

    logSupabaseClientError("submitSectionLinkRegistration:insert", error, {
      section_id: sectionId,
    });
    return { ok: false, message: dict.actionErrors.register.insertFailed };
  }

  return { ok: false, message: dict.actionErrors.register.insertFailed };
}
