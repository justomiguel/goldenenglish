"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  publicRegistrationSchema,
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

  const parsed = publicRegistrationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "validation" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("registrations").insert({
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    dni: parsed.data.dni,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    level_interest: parsed.data.level_interest || null,
    status: "new",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  return { ok: true };
}
