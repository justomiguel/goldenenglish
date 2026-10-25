"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { proposeRegistrationScheduleCore } from "@/lib/register/proposeRegistrationScheduleCore";
import {
  requireRegistrationIntakeAdmin,
  revalidateRegistrationInbox,
} from "@/lib/register/registrationIntakeActionSupport";
import type { IntakeActionResult } from "@/app/[locale]/dashboard/admin/registrations/registrationIntakeActions";

export async function proposeRegistrationScheduleAction(input: {
  locale: string;
  registrationId: string;
  sectionId: string;
}): Promise<IntakeActionResult> {
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const dict = await getDictionary(input.locale);
  const result = await proposeRegistrationScheduleCore({
    admin: await createAdminClient(),
    locale: input.locale,
    dict,
    registrationId: input.registrationId,
    sectionId: input.sectionId,
  });
  if (!result.ok) return result;
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}
