import "server-only";

import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { readCentrolistoGaMeasurementId } from "@/lib/pulsar/centrolistoAnalytics";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export async function loadCentrolistoGaMeasurementId(): Promise<string | null> {
  if (!isPulsarSupabaseConfigured()) return null;
  const admin = createPulsarAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("ga_measurement_id")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return null;
  return readCentrolistoGaMeasurementId(String(data.ga_measurement_id ?? ""));
}

export async function saveCentrolistoGaMeasurementId(input: {
  measurementId: string;
  actorUserId: string;
  actorEmail: string;
}): Promise<
  | { ok: true; measurementId: string | null }
  | { ok: false; errorCode: "invalid_input" | "not_configured" | "db_write_failed" }
> {
  const trimmed = input.measurementId.trim();
  const measurementId = trimmed === "" ? null : readCentrolistoGaMeasurementId(trimmed);
  if (trimmed !== "" && !measurementId) return { ok: false, errorCode: "invalid_input" };
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const admin = createPulsarAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .update({
      ga_measurement_id: measurementId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");
  if (error) {
    logSupabaseError("saveCentrolistoGaMeasurementId", error, {});
    return { ok: false, errorCode: "db_write_failed" };
  }
  const { error: auditError } = await admin.from("platform_audit_log").insert({
    actor_user_id: input.actorUserId,
    actor_email: input.actorEmail,
    action: "settings.ga_measurement_id",
    tenant_slug: "platform",
    changed_fields: ["ga_measurement_id"],
  });
  if (auditError) logSupabaseError("saveCentrolistoGaMeasurementId:audit", auditError, {});
  return { ok: true, measurementId };
}
