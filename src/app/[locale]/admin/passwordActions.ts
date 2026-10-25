"use server";

import { revalidatePath } from "next/cache";
import { logServerActionException, logSupabaseError } from "@/lib/logging/serverActionLog";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { createPulsarAdminClient } from "@/lib/supabase/pulsar";

const MIN_PASSWORD_LENGTH = 8;

export async function changePulsarStaffPasswordAction(args: {
  locale: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const session = await getPulsarStaffSession();
  if (!session || session.mode !== "pulsar-db") {
    return { ok: false, errorCode: "unauthorized" };
  }
  if (!session.mustChangePassword) {
    return { ok: false, errorCode: "not_required" };
  }
  if (args.password.length < MIN_PASSWORD_LENGTH || args.password.length > 200) {
    return { ok: false, errorCode: "too_short" };
  }

  try {
    const admin = createPulsarAdminClient();
    const { error: authErr } = await admin.auth.admin.updateUserById(session.userId, {
      password: args.password,
    });
    if (authErr) {
      logServerActionException("changePulsarStaffPasswordAction:updateUser", authErr, {
        userId: session.userId,
      });
      return { ok: false, errorCode: "update_failed" };
    }

    const { error: flagErr } = await admin
      .from("platform_staff")
      .update({ must_change_password: false })
      .eq("user_id", session.userId);
    if (flagErr) {
      logSupabaseError("changePulsarStaffPasswordAction:clearFlag", flagErr, {
        userId: session.userId,
      });
      return { ok: false, errorCode: "update_failed" };
    }

    revalidatePath(`/${args.locale}/admin`);
    revalidatePath(`/${args.locale}/admin/password`);
    return { ok: true };
  } catch (err) {
    logServerActionException("changePulsarStaffPasswordAction:catch", err, {
      userId: session.userId,
    });
    return { ok: false, errorCode: "update_failed" };
  }
}
