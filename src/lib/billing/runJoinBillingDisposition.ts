import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyJoinBillingDisposition,
} from "@/lib/billing/applyJoinBillingDisposition";
import { createJoinBillingDispositionPort } from "@/lib/billing/createJoinBillingDispositionPort";
import type { JoinBillingDisposition } from "@/lib/billing/joinBillingDispositionSchema";

export async function runJoinBillingDisposition(input: {
  admin: SupabaseClient;
  studentId: string;
  sectionIds: string[];
  disposition: JoinBillingDisposition;
  actorId: string;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; code: "seed_failed" }> {
  return applyJoinBillingDisposition(createJoinBillingDispositionPort(input.admin), {
    studentId: input.studentId,
    sectionIds: input.sectionIds,
    disposition: input.disposition,
    actorId: input.actorId,
    now: input.now,
  });
}
