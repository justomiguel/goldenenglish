import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { buildAuditDiff } from "@/lib/audit/buildAuditDiff";
import { sanitizeAuditPayload } from "@/lib/audit/sanitizeAuditPayload";
import type { AuditDiff, AuditJsonObject, RecordAuditEventInput } from "@/lib/audit/types";

function sanitizedDiff(diff: AuditDiff): AuditDiff {
  return Object.fromEntries(
    Object.entries(diff).map(([key, value]) => [
      key,
      {
        before: sanitizeAuditPayload({ value: value.before }).value,
        after: sanitizeAuditPayload({ value: value.after }).value,
      },
    ]),
  );
}

export async function recordAuditEvent(
  input: RecordAuditEventInput,
): Promise<{ ok: boolean }> {
  try {
    const beforeValues = sanitizeAuditPayload(input.beforeValues ?? {});
    const afterValues = sanitizeAuditPayload(input.afterValues ?? {});
    const diff = sanitizedDiff(input.diff ?? buildAuditDiff(beforeValues, afterValues));
    const metadata = sanitizeAuditPayload(input.metadata ?? {});

    const admin = createAdminClient();
    const { error } = await admin.from("audit_events").insert({
      actor_id: input.actorId,
      actor_role: input.actorRole ?? null,
      domain: input.domain,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      summary: input.summary,
      before_values: beforeValues,
      after_values: afterValues,
      diff: diff as unknown as AuditJsonObject,
      metadata,
      correlation_id: input.correlationId ?? null,
    });

    if (error) {
      logSupabaseClientError("recordAuditEvent:insert", error, {
        action: input.action,
        domain: input.domain,
        resourceType: input.resourceType,
      });
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    logServerException("recordAuditEvent", err, {
      action: input.action,
      domain: input.domain,
    });
    return { ok: false };
  }
}
