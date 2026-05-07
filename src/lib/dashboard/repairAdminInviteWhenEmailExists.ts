import type { SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserIdByNormalizedEmail } from "@/lib/supabase/findAuthUserIdByNormalizedEmail";
import {
  type AdminInvitedProfileFields,
  upsertAdminInvitedProfile,
} from "@/lib/dashboard/upsertAdminInvitedProfile";
import { resolveAuthAdminCreateUserDiagnostic } from "@/lib/dashboard/resolveAuthAdminCreateUserDiagnostic";

export type RepairAdminInviteEmailExistsResult =
  | { kind: "repaired"; userId: string }
  | { kind: "still_duplicate" }
  | {
      kind: "failed";
      diagnostic:
        | "list_users"
        | "auth_update"
        | "weak_password"
        | "profile_save";
    };

/**
 * When `createUser` returns email-already-registered, links the existing Auth user
 * to `profiles` if the profile row is missing (half-provisioned user), and syncs
 * password + user_metadata from the admin invite form.
 */
export async function repairAdminInviteWhenEmailExists(input: {
  admin: SupabaseClient;
  normalizedEmail: string;
  password: string;
  userMetadata: Record<string, string>;
  profile: Omit<AdminInvitedProfileFields, "userId">;
}): Promise<RepairAdminInviteEmailExistsResult> {
  const { admin, normalizedEmail, password, userMetadata, profile } = input;

  const { userId, error: findErr } = await findAuthUserIdByNormalizedEmail(
    admin,
    normalizedEmail,
  );
  if (findErr) {
    return { kind: "failed", diagnostic: "list_users" };
  }
  if (!userId) {
    return { kind: "still_duplicate" };
  }

  const { data: existingProfile, error: profReadErr } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profReadErr) {
    return { kind: "failed", diagnostic: "profile_save" };
  }
  if (existingProfile?.id) {
    return { kind: "still_duplicate" };
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });
  if (updErr) {
    const diag = resolveAuthAdminCreateUserDiagnostic(updErr);
    if (diag === "weak_password") {
      return { kind: "failed", diagnostic: "weak_password" };
    }
    return { kind: "failed", diagnostic: "auth_update" };
  }

  const { error: upsertErr } = await upsertAdminInvitedProfile(admin, {
    ...profile,
    userId,
  });
  if (upsertErr) {
    return { kind: "failed", diagnostic: "profile_save" };
  }

  return { kind: "repaired", userId };
}
