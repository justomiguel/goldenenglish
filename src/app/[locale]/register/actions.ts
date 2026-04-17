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

  const { error } = await supabase.from("registrations").insert({
    first_name: d.first_name,
    last_name: d.last_name,
    dni: d.dni,
    email: d.email,
    phone: d.phone,
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

  if (error) {
    return { ok: false, message: dict.actionErrors.register.insertFailed };
  }

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  return { ok: true };
}
