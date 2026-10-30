import {
  logServerAuthzDenied,
  logServerException,
  logSupabaseError,
} from "@/lib/logging/serverActionLog";
import {
  createPulsarAdminClient,
  createPulsarServerClient,
  isPulsarSupabaseConfigured,
} from "@/lib/supabase/pulsar";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export type PulsarStaffSession = {
  userId: string;
  email: string;
  mode: "pulsar-db" | "dev-local";
  mustChangePassword: boolean;
};

/** Fleet home, or the forced password screen when the staff password is temporary. */
export function pulsarStaffHomePath(locale: string, session: PulsarStaffSession): string {
  if (session.mustChangePassword) return `/${locale}/admin/password`;
  return `/${locale}/admin`;
}

/** Signed-in Pulsar user from cookies. Skips the local staff bypass. */
export async function getPulsarCookieSession(): Promise<{ email: string } | null> {
  if (!isPulsarSupabaseConfigured()) return null;
  try {
    const serverClient = await createPulsarServerClient();
    const {
      data: { user },
      error,
    } = await serverClient.auth.getUser();
    if (error || !user?.email) return null;
    return { email: user.email };
  } catch (err) {
    logServerException("pulsarStaffAuth:cookieSession", err);
    return null;
  }
}

export async function getPulsarStaffSession(): Promise<PulsarStaffSession | null> {
  if (!isPulsarSupabaseConfigured()) {
    if (process.env.NODE_ENV === "development" && (await isPulsarPlatformRequest())) {
      return {
        userId: "00000000-0000-0000-0000-000000000000",
        email: "dev@pulsarlab.cl",
        mode: "dev-local",
        mustChangePassword: false,
      };
    }
    return null;
  }

  try {
    const serverClient = await createPulsarServerClient();
    const {
      data: { user },
      error: authErr,
    } = await serverClient.auth.getUser();

    if (authErr || !user) {
      return null;
    }

    const admin = createPulsarAdminClient();
    const { data: staffRow, error: staffErr } = await admin
      .from("platform_staff")
      .select("user_id, email, must_change_password")
      .eq("user_id", user.id)
      .maybeSingle();

    if (staffErr) {
      logSupabaseError("pulsarStaffAuth:select_staff", staffErr, { userId: user.id });
      return null;
    }

    if (!staffRow) {
      logServerAuthzDenied("pulsarStaffAuth:not_staff", { userId: user.id });
      return null;
    }

    return {
      userId: user.id,
      email: user.email ?? String(staffRow.email ?? ""),
      mode: "pulsar-db",
      mustChangePassword: staffRow.must_change_password === true,
    };
  } catch (err) {
    logServerException("pulsarStaffAuth:getSession", err);
    return null;
  }
}

export async function assertPulsarStaffSession(): Promise<PulsarStaffSession> {
  const session = await getPulsarStaffSession();
  if (!session) {
    throw new Error("pulsar_staff_unauthorized");
  }
  return session;
}
