"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPassword } from "@/lib/supabase/verifyUserPassword";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import {
  myProfilePasswordSchema,
  myProfilePersonalSchema,
} from "@/lib/profile/myProfileUpdateSchema";

export type MyProfileActionErrorKey =
  | "unauthorized"
  | "validation"
  | "minorLocked"
  | "dniTaken"
  | "generic"
  | "wrongPassword"
  | "weakPassword";

export type MyProfileActionResult =
  | { ok: true }
  | { ok: false; errorKey: MyProfileActionErrorKey };

function revalidateProfile(locale: string) {
  revalidatePath(`/${locale}/dashboard/profile`);
  revalidatePath(`/${locale}/dashboard`);
}

export async function updateMyProfile(raw: unknown): Promise<MyProfileActionResult> {
  const parsed = myProfilePersonalSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errorKey: "validation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errorKey: "unauthorized" };

  const { locale, first_name, last_name, dni_or_passport, phone, birth_date } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name,
      last_name,
      dni_or_passport,
      phone,
      birth_date,
    })
    .eq("id", user.id);

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("minor_profile_self_edit_forbidden")) {
      return { ok: false, errorKey: "minorLocked" };
    }
    if (error.code === "23505" || msg.toLowerCase().includes("unique")) {
      return { ok: false, errorKey: "dniTaken" };
    }
    return { ok: false, errorKey: "generic" };
  }

  revalidateProfile(locale);
  await recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.myProfile,
    metadata: { part: "personal" },
  });
  return { ok: true };
}

export async function changeMyPassword(raw: unknown): Promise<MyProfileActionResult> {
  const parsed = myProfilePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    if (flat.new_password?.length) return { ok: false, errorKey: "weakPassword" };
    return { ok: false, errorKey: "validation" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, errorKey: "unauthorized" };

  const { locale, current_password, new_password } = parsed.data;
  const okPwd = await verifyUserPassword(user.email, current_password);
  if (!okPwd) return { ok: false, errorKey: "wrongPassword" };

  const { error } = await supabase.auth.updateUser({ password: new_password });
  if (error) return { ok: false, errorKey: "generic" };

  revalidateProfile(locale);
  await recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.myProfile,
    metadata: { part: "password" },
  });
  return { ok: true };
}
