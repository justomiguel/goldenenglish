"use server";

import { revalidatePath } from "next/cache";
import { decideReview } from "@/lib/events/eventShareGrant";
import {
  eventShareGrantClient,
  listPendingGrants,
  setGrantStatus,
} from "@/lib/events/server/eventShareGrantStore";
import { logServerError } from "@/lib/logging/serverActionLog";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { createPulsarAdminClient } from "@/lib/supabase/pulsar";

export async function reviewEventShareAction(input: {
  locale: string;
  grantId: string;
  decision: "approve" | "reject";
}): Promise<{ ok: boolean; code?: string }> {
  const session = await getPulsarStaffSession();
  if (!session) return { ok: false, code: "share_forbidden" };
  const grant = (await listPendingGrants(eventShareGrantClient())).find((row) => row.id === input.grantId);
  if (!grant) return { ok: false, code: "share_not_approved" };
  const review = decideReview({ status: grant.status, decision: input.decision });
  if (!review.ok) return { ok: false, code: review.code };
  const saved = await setGrantStatus(eventShareGrantClient(), {
    id: grant.id,
    status: review.next,
    reviewedBy: session.userId,
  });
  if (!saved.ok) return { ok: false, code: "share_store_failed" };

  const action =
    grant.status === "pending"
      ? input.decision === "approve"
        ? "event_share_approve"
        : "event_share_reject"
      : input.decision === "approve"
        ? "event_unshare_approve"
        : "event_unshare_reject";
  const { error } = await createPulsarAdminClient().from("platform_audit_log").insert({
    actor_user_id: session.userId,
    actor_email: session.email,
    action,
    tenant_slug: grant.ownerSlug,
    changed_fields: [`guest:${grant.guestSlug}`, `event:${grant.ownerEventId}`],
  });
  if (error) {
    logServerError("events.share.store", { op: "audit", code: "share_store_failed", action });
  }
  revalidatePath(`/${input.locale}/admin`, "page");
  return { ok: true };
}
