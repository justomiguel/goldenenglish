import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildGuestShopperProfile } from "@/lib/shop/guestShopperProfile";
import type { EnsureGuestShopperParentResult } from "@/lib/shop/types";
import { findAuthUserIdByNormalizedEmail } from "@/lib/supabase/findAuthUserIdByNormalizedEmail";
import { logAuthAdminCreateUserFailure, logSupabaseClientError } from "@/lib/logging/serverActionLog";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newTempPassword(): string {
  return randomBytes(18).toString("base64url");
}

export async function ensureGuestShopperParent(input: {
  email: string;
  admin: SupabaseClient;
}): Promise<EnsureGuestShopperParentResult> {
  const email = normalizeEmail(input.email);
  const found = await findAuthUserIdByNormalizedEmail(input.admin, email);
  if (found.error) {
    logSupabaseClientError("ensureGuestShopperParent:listUsers", found.error);
    return { kind: "wrong_role" };
  }
  if (found.userId) {
    return loadExistingShopper(input.admin, found.userId);
  }
  return createGuestParent(input.admin, email);
}

async function loadExistingShopper(
  admin: SupabaseClient,
  userId: string,
): Promise<EnsureGuestShopperParentResult> {
  const { data, error } = await admin.from("profiles").select("id, role").eq("id", userId).maybeSingle();
  if (error) {
    logSupabaseClientError("ensureGuestShopperParent:profile", error, { userId });
    return { kind: "wrong_role" };
  }
  if (data?.role === "parent") {
    return { kind: "existing_parent", profileId: data.id as string };
  }
  return { kind: "wrong_role" };
}

async function createGuestParent(
  admin: SupabaseClient,
  email: string,
): Promise<EnsureGuestShopperParentResult> {
  const tempPassword = newTempPassword();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { must_change_password: true },
    user_metadata: { role: "parent", provisioning_source: "admin_invite" },
  });
  if (error || !created.user) {
    logAuthAdminCreateUserFailure("ensureGuestShopperParent:createUser", error ?? {}, {
      classified_issue: "no_user_payload",
    });
    return { kind: "wrong_role" };
  }
  const profileId = created.user.id;
  const profile = buildGuestShopperProfile(email, profileId);
  const { error: upsertError } = await admin.from("profiles").upsert({
    id: profileId,
    ...profile,
  });
  if (upsertError) {
    logSupabaseClientError("ensureGuestShopperParent:upsert", upsertError, { profileId });
    return { kind: "wrong_role" };
  }
  return { kind: "created", profileId, tempPassword };
}
