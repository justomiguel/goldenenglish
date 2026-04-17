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

export async function recordSystemAudit(input: {
  action: string;
  resourceType: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
}): Promise<{ ok: boolean }> {
  try {
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
