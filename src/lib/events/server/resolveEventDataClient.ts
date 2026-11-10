import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  eventShareGrantClient,
  listApprovedGrantsForGuest,
} from "@/lib/events/server/eventShareGrantStore";
import { logServerError } from "@/lib/logging/serverActionLog";
import { createAdminClient, createAdminClientFromCredentials } from "@/lib/supabase/admin";
import { bindInstituteDataPlane } from "@/lib/supabase/bindInstituteDataPlane";
import { getTenantBySlug } from "@/lib/tenant/tenantRegistry";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

export type EventDataClient =
  | { ok: true; client: SupabaseClient; ownerSlug: string; access: "local" | "guest" }
  | { ok: false; code: "share_not_approved" };

type ResolveInput = {
  eventId: string;
  currentSlug: string;
  currentClient: SupabaseClient;
  approvedGrants: readonly { ownerSlug: string; ownerEventId: string }[];
  ownerClient: (ownerSlug: string) => SupabaseClient | null;
};

export async function resolveEventDataClientWith(input: ResolveInput): Promise<EventDataClient> {
  const { data, error } = await input.currentClient
    .from("events")
    .select("id")
    .eq("id", input.eventId)
    .maybeSingle();
  if (error) {
    logServerError("events.share.resolve", { eventId: input.eventId, code: "share_not_approved" });
    return { ok: false, code: "share_not_approved" };
  }
  if (data) {
    return { ok: true, client: input.currentClient, ownerSlug: input.currentSlug, access: "local" };
  }
  const grant = input.approvedGrants.find((row) => row.ownerEventId === input.eventId);
  if (!grant) return { ok: false, code: "share_not_approved" };
  const owner = input.ownerClient(grant.ownerSlug);
  if (!owner) {
    logServerError("events.share.resolve", {
      eventId: input.eventId,
      ownerSlug: grant.ownerSlug,
      code: "share_not_approved",
    });
    return { ok: false, code: "share_not_approved" };
  }
  return { ok: true, client: owner, ownerSlug: grant.ownerSlug, access: "guest" };
}

export function ownerAdminClient(ownerSlug: string): SupabaseClient | null {
  const tenant = getTenantBySlug(ownerSlug);
  if (!tenant?.supabaseUrl || !tenant.supabaseServiceRoleKey) return null;
  return bindInstituteDataPlane(
    createAdminClientFromCredentials(tenant.supabaseUrl, tenant.supabaseServiceRoleKey),
    tenant,
  );
}

export async function resolveEventDataClient(eventId: string): Promise<EventDataClient> {
  const tenant = await resolveRequestTenant();
  const currentSlug = tenant?.slug ?? "";
  const currentClient = await createAdminClient();
  const grants = currentSlug
    ? await listApprovedGrantsForGuest(eventShareGrantClient(), currentSlug)
    : [];
  return resolveEventDataClientWith({
    eventId,
    currentSlug,
    currentClient,
    approvedGrants: grants,
    ownerClient: ownerAdminClient,
  });
}
