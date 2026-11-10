import "server-only";

import pg from "pg";
import { logServerActionException, logServerWarn, logSupabaseError } from "@/lib/logging/serverActionLog";
import { applyOperatorAuthPassword } from "@/lib/pulsar/platformOperatorAdmin";
import { parseOperatorPassword } from "@/lib/pulsar/platformOperatorPasswordRules";
import { createPulsarAdminClient, isPulsarSupabaseConfigured, readSharedPulsarCredentials } from "@/lib/supabase/pulsar";

export async function loadPlatformOperatorAdminPassword(): Promise<string | null> {
  if (!isPulsarSupabaseConfigured()) return null;
  const admin = createPulsarAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("operator_admin_password")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return null;
  const value = String(data.operator_admin_password ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function loadPlatformOperatorPasswordSet(): Promise<boolean> {
  return (await loadPlatformOperatorAdminPassword()) !== null;
}

export async function savePlatformOperatorAdminPassword(input: {
  password: string;
  actorUserId: string;
  actorEmail: string;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const parsed = parseOperatorPassword(input.password);
  if (!parsed.ok) return parsed;
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const admin = createPulsarAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .update({
      operator_admin_password: parsed.password,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");
  if (error) {
    logSupabaseError("savePlatformOperatorAdminPassword", error, {});
    return { ok: false, errorCode: "operator_password_save_failed" };
  }
  const { error: auditError } = await admin.from("platform_audit_log").insert({
    actor_user_id: input.actorUserId,
    actor_email: input.actorEmail,
    action: "settings.operator_admin_password",
    tenant_slug: "platform",
    changed_fields: ["operator_admin_password"],
  });
  if (auditError) logSupabaseError("savePlatformOperatorAdminPassword:audit", auditError, {});
  const synced = await syncOperatorLoginPassword(parsed.password);
  if (!synced) return { ok: false, errorCode: "operator_password_login_failed" };
  return { ok: true };
}

async function syncOperatorLoginPassword(password: string): Promise<boolean> {
  const databaseUrl = readSharedPulsarCredentials()?.databaseUrl ?? "";
  if (!databaseUrl) {
    await logServerWarn("savePlatformOperatorAdminPassword", { reason: "missing_pulsar_database_url" });
    return false;
  }
  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await applyOperatorAuthPassword(client, password);
    return true;
  } catch (err) {
    logServerActionException("savePlatformOperatorAdminPassword:login", err, {});
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}
