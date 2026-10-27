import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { recordAuditEvent, type AuditJsonObject } from "@/lib/audit";

export async function auditAcademicProfileStaffAction(input: {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const payload = {
    fieldId: typeof input.payload?.fieldId === "string" ? input.payload.fieldId : null,
    studentId: typeof input.payload?.studentId === "string" ? input.payload.studentId : null,
  };
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("system_config_audit").insert({
      actor_id: input.actorId,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      payload,
    });
    if (error) {
      logSupabaseClientError("auditAcademicProfileStaffAction:insert", error, {
        action: input.action,
      });
    }
    void recordAuditEvent({
      actorId: input.actorId,
      actorRole: "staff",
      domain: "academic",
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      summary: `${input.action} ${input.resourceType}`,
      metadata: payload as unknown as AuditJsonObject,
    });
  } catch (err) {
    logServerException("auditAcademicProfileStaffAction", err, { action: input.action });
  }
}
