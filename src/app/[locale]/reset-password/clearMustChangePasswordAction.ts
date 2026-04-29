"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const S = "clearMustChangePasswordFlagAction";

/**
 * Self-mutation that flips `app_metadata.must_change_password` to false for the
 * current session's user. Called after `useResetPassword` successfully updates
 * the password, so the next request through the proxy / middleware no longer
 * redirects to /reset-password.
 *
 * Why admin client: `app_metadata` is only writable by the service role, so the
 * user cannot simply `updateUser({ data: ... })` from the browser to bypass
 * the must-change guard.
 */
export async function clearMustChangePasswordFlagAction(): Promise<{
  ok: boolean;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return { ok: false };

    const admin = createAdminClient();
    const { data, error: readErr } = await admin.auth.admin.getUserById(user.id);
    if (readErr || !data?.user) {
      if (readErr) logSupabaseClientError(`${S}:read`, readErr, { userId: user.id });
      return { ok: false };
    }
    const existing = (data.user.app_metadata ?? {}) as Record<string, unknown>;

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...existing, must_change_password: false },
    });
    if (error) {
      logSupabaseClientError(`${S}:update`, error, { userId: user.id });
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    logServerException(S, e);
    return { ok: false };
  }
}
