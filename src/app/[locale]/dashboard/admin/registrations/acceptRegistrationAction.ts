"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizeRegistrationAcceptError } from "@/lib/register/localizeRegistrationAcceptError";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import {
  acceptRegistrationSchema,
  type AcceptRegistrationInput,
} from "@/lib/register/acceptRegistrationHelpers";
import { acceptRegistrationLead } from "@/lib/register/acceptRegistrationLead";

export type AcceptRegistrationResult =
  | { ok: true; studentId: string; pendingSectionIds: string[] }
  | { ok: false; message: string };

export async function acceptRegistration(
  locale: string,
  raw: AcceptRegistrationInput,
): Promise<AcceptRegistrationResult> {
  let session: SupabaseClient;
  try {
    ({ supabase: session } = await assertAdmin());
  } catch {
    logServerAuthzDenied("acceptRegistration");
    return {
      ok: false,
      message: localizeRegistrationAcceptError(await getDictionary(locale), "forbidden"),
    };
  }

  const parsed = acceptRegistrationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: localizeRegistrationAcceptError(await getDictionary(locale), "invalid_data"),
    };
  }

  const dict = await getDictionary(locale);
  const result = await acceptRegistrationLead({
    admin: createAdminClient(),
    enrollClient: session,
    locale,
    dict,
    registrationId: parsed.data.registration_id,
    password: parsed.data.password,
    birthDate: parsed.data.birth_date,
  });
  if (!result.ok) return result;

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  revalidatePath(`/${locale}/dashboard/admin`, "page");
  revalidateAcademicSurfaces(locale);
  return result;
}
