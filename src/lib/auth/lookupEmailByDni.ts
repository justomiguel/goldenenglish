import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultEmail as studentSyntheticEmail,
} from "@/lib/import/studentImportUtils";
import { parentDefaultEmail } from "@/lib/import/parentDefaultEmail";
import {
  logServerActionInvariantViolation,
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

/**
 * Resolve a DNI / passport into the email address Supabase Auth will accept
 * for `signInWithPassword`.
 *
 * **Opacity is the contract.** This function NEVER throws and NEVER signals
 * "no such DNI"; instead, when the DNI does not match any profile (or any
 * lookup fails) it returns the deterministic synthetic address derived from
 * the DNI itself. The caller relies on this so the public endpoint cannot be
 * abused as a user-existence oracle (OWASP A07).
 *
 * The `SupabaseClient` MUST be a service-role admin client because the
 * `profiles` table is locked down by RLS for non-admin readers.
 */
export async function lookupEmailByDni(
  admin: SupabaseClient,
  dni: string,
): Promise<string> {
  const fallbackStudent = studentSyntheticEmail(dni);
  let profile: { id: string; role: string } | null = null;

  try {
    const { data, error } = await admin
      .from("profiles")
      .select("id, role")
      .eq("dni_or_passport", dni)
      .maybeSingle();
    if (error) {
      logSupabaseClientError("lookupEmailByDni:profiles", error);
      return fallbackStudent;
    }
    profile = (data as { id: string; role: string } | null) ?? null;
  } catch (err) {
    logServerException("lookupEmailByDni:profiles_throw", err);
    return fallbackStudent;
  }

  if (!profile?.id) {
    return fallbackStudent;
  }

  const syntheticForRole =
    profile.role === "parent" || profile.role === "tutor"
      ? parentDefaultEmail(dni)
      : studentSyntheticEmail(dni);

  try {
    const { data, error } = await admin.auth.admin.getUserById(profile.id);
    if (error) {
      logServerActionInvariantViolation(
        "lookupEmailByDni:getUserById",
        error.message ?? "getUserById_error",
        { profileId: profile.id },
      );
      return syntheticForRole;
    }
    const realEmail = data?.user?.email?.trim();
    if (realEmail) return realEmail.toLowerCase();
    return syntheticForRole;
  } catch (err) {
    logServerException("lookupEmailByDni:getUserById_throw", err, {
      profileId: profile.id,
    });
    return syntheticForRole;
  }
}
