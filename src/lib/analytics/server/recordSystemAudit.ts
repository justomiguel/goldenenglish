"use server";

import { assertAdmin } from "@/lib/dashboard/assertAdmin";

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
    if (error) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
