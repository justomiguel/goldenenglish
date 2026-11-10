"use server";

import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import {
  logServerAuthzDenied,
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { recordAuditEvent, type AuditDomain, type AuditJsonObject } from "@/lib/audit";
import { currentEventWriteAudit } from "@/lib/events/server/eventWriteAuditContext";

function inferAuditDomain(resourceType: string): AuditDomain {
  if (/payment|receipt|invoice|billing|scholarship|coupon|promotion|fee/i.test(resourceType)) {
    return "finance";
  }
  if (/section|attendance|enrollment|cohort/i.test(resourceType)) return "sections";
  if (/content|learning|task|academic|calendar|grade/i.test(resourceType)) return "academic";
  if (/user|profile|registration|credential|avatar/i.test(resourceType)) return "identity";
  if (/message|email|template|communication/i.test(resourceType)) return "communications";
  return "system";
}

export async function recordSystemAudit(input: {
  action: string;
  resourceType: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
  domain?: AuditDomain;
  summary?: string;
}): Promise<{ ok: boolean }> {
  try {
    const mirror = currentEventWriteAudit();
    if (mirror) {
      const { error } = await mirror.client.from("system_config_audit").insert({
        actor_id: null,
        action: input.action,
        resource_type: input.resourceType,
        resource_id: input.resourceId ?? null,
        payload: {
          ...(input.payload ?? {}),
          guest_slug: mirror.guestSlug,
          guest_actor_id: mirror.guestActorId,
        },
      });
      if (error) {
        logSupabaseClientError("recordSystemAudit:guest", error, {
          action: input.action,
          resourceType: input.resourceType,
          code: "share_store_failed",
        });
        return { ok: false };
      }
      return { ok: true };
    }
    const { supabase, user } = await assertAdmin();
    const { error } = await supabase.from("system_config_audit").insert({
      actor_id: user.id,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      payload: input.payload ?? {},
    });
    if (error) {
      logSupabaseClientError("recordSystemAudit:insert", error, {
        action: input.action,
        resourceType: input.resourceType,
      });
      return { ok: false };
    }
    void recordAuditEvent({
      actorId: user.id,
      actorRole: "admin",
      domain: input.domain ?? inferAuditDomain(input.resourceType),
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      summary: input.summary ?? `${input.action} ${input.resourceType}`,
      metadata: (input.payload ?? {}) as unknown as AuditJsonObject,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED || msg === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("recordSystemAudit");
    } else {
      logServerException("recordSystemAudit", e, { action: input.action });
    }
    return { ok: false };
  }
}
