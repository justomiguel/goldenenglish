import "server-only";

import { logServerException, logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  createPulsarAdminClient,
  createPulsarServerClient,
  isPulsarSupabaseConfigured,
} from "@/lib/supabase/pulsar";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

const DEV_STAFF_ID = "00000000-0000-0000-0000-000000000000";

export type PulsarSiteActor =
  | { kind: "staff"; userId: string; email: string; mustChangePassword: boolean }
  | { kind: "owner"; userId: string; email: string }
  | { kind: "login" }
  | { kind: "forbidden" };

async function signedInUser(): Promise<{ id: string; email: string } | null> {
  const serverClient = await createPulsarServerClient();
  const {
    data: { user },
    error,
  } = await serverClient.auth.getUser();
  if (error || !user) return null;
  return { id: user.id, email: user.email ?? "" };
}

/** Staff of this request, or the owner of this slug. Does not log a denial for an owner. */
export async function resolvePulsarSiteActor(slug: string): Promise<PulsarSiteActor> {
  if (!isPulsarSupabaseConfigured()) {
    if (process.env.NODE_ENV === "development" && (await isPulsarPlatformRequest())) {
      return {
        kind: "staff",
        userId: DEV_STAFF_ID,
        email: "dev@pulsarlab.cl",
        mustChangePassword: false,
      };
    }
    return { kind: "login" };
  }

  try {
    const user = await signedInUser();
    if (!user) return { kind: "login" };
    const admin = createPulsarAdminClient();
    const { data: staff, error: staffErr } = await admin
      .from("platform_staff")
      .select("user_id, must_change_password")
      .eq("user_id", user.id)
      .maybeSingle();
    if (staffErr) {
      logSupabaseError("pulsarSiteActor:staff", staffErr, { userId: user.id });
      return { kind: "forbidden" };
    }
    if (staff) {
      return {
        kind: "staff",
        userId: user.id,
        email: user.email,
        mustChangePassword: staff.must_change_password === true,
      };
    }
    const { data: owner, error: ownerErr } = await admin
      .from("platform_tenant_owners")
      .select("owner_user_id")
      .eq("tenant_slug", slug)
      .maybeSingle();
    if (ownerErr) {
      logSupabaseError("pulsarSiteActor:owner", ownerErr, { userId: user.id, slug });
      return { kind: "forbidden" };
    }
    if (owner?.owner_user_id === user.id) {
      return { kind: "owner", userId: user.id, email: user.email };
    }
    return { kind: "forbidden" };
  } catch (err) {
    logServerException("pulsarSiteActor", err);
    return { kind: "forbidden" };
  }
}
