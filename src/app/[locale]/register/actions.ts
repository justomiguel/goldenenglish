"use server";

import { revalidatePath } from "next/cache";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { createClient } from "@/lib/supabase/server";
import {
  buildPublicRegistrationSchema,
  type PublicRegistrationInput,
} from "@/lib/register/publicRegistrationSchema";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";

export type RegisterActionState = { ok: boolean; message?: string };

export async function submitPublicRegistration(
  locale: string,
  raw: PublicRegistrationInput,
): Promise<RegisterActionState> {
  if (!(await getInscriptionsEnabled())) {
    return { ok: false, message: "closed" };
  }

  const parsed = buildPublicRegistrationSchema(
    getLegalAgeMajorityFromSystem(),
  ).safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "validation" };
  }

  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("registrations").insert({
    first_name: d.first_name,
    last_name: d.last_name,
    dni: d.dni,
    email: d.email,
    phone: d.phone,
    birth_date: d.birth_date,
    level_interest: d.level_interest,
    status: "new",
    tutor_name: d.tutor_name?.trim() || null,
    tutor_dni: d.tutor_dni?.trim() || null,
    tutor_phone: d.tutor_phone?.trim() || null,
    tutor_email: d.tutor_email?.trim() || null,
    tutor_relationship: d.tutor_relationship?.trim() || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  return { ok: true };
}
