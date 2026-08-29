"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { completeTrialRescheduleSubmit } from "@/lib/register/completeTrialRescheduleSubmit";

export type TrialRescheduleActionResult = { ok: true } | { ok: false; message: string };

export async function submitTrialRescheduleAction(input: {
  locale: string;
  token: string;
  sectionIds: string[];
}): Promise<TrialRescheduleActionResult> {
  const dict = await getDictionary(input.locale);
  const result = await completeTrialRescheduleSubmit({
    locale: input.locale,
    dict,
    supabase: await createClient(),
    admin: createAdminClient(),
    rescheduleToken: input.token,
    sectionIds: input.sectionIds,
  });
  if (!result.ok) return { ok: false, message: result.message ?? dict.register.error };
  if (result.payToken) {
    redirect(`/${input.locale}/clase-prueba/${result.payToken}`);
  }
  return { ok: true };
}
