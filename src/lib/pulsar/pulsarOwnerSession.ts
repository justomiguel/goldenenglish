import { logServerAuthzDenied, logServerException, logSupabaseError } from "@/lib/logging/serverActionLog";
import { createPulsarAdminClient, createPulsarServerClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

/** Signed-in CentroListo owner. Null when the session is missing or the user is not an owner. */
export async function getPulsarOwnerUserId(): Promise<string | null> {
  if (!isPulsarSupabaseConfigured()) return null;
  try {
    const server = await createPulsarServerClient();
    const {
      data: { user },
      error,
    } = await server.auth.getUser();
    if (error || !user) return null;
    const admin = createPulsarAdminClient();
    const { data, error: ownerErr } = await admin
      .from("platform_owners")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (ownerErr) {
      logSupabaseError("pulsarOwnerSession", ownerErr, { userId: user.id });
      return null;
    }
    if (!data) {
      logServerAuthzDenied("pulsarOwnerSession", { userId: user.id });
      return null;
    }
    return user.id;
  } catch (err) {
    logServerException("pulsarOwnerSession", err);
    return null;
  }
}
