import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent, type AuditJsonObject } from "@/lib/audit";

export async function auditLearningContentStaffAction(input: {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("system_config_audit").insert({
      actor_id: input.actorId,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      payload: input.payload ?? {},
    });
    if (error) {
      logSupabaseClientError("auditLearningContentStaffAction:insert", error, {
        action: input.action,
        resourceType: input.resourceType,
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
      metadata: (input.payload ?? {}) as unknown as AuditJsonObject,
    });
  } catch (err) {
    logServerException("auditLearningContentStaffAction", err, { action: input.action });
  }
}
