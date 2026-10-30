import "server-only";

import { headers } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { GE_PULSAR_THEME_SLUG_HEADER } from "@/lib/pulsar/pulsarThemeSlugHeader";
import { resolvePulsarSiteActor } from "@/lib/pulsar/pulsarSiteActor";
import { loadPulsarTenantBySlugForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { createAdminClient } from "@/lib/supabase/admin";
import { enterTenant } from "@/lib/tenant/tenantAls";

export interface PulsarThemeEditorContext {
  supabase: SupabaseClient;
  user: User;
}

/**
 * Pulsar staff editing one institute. `updated_by` stays null on an external
 * project because that auth user does not exist there.
 */
export async function pulsarThemeEditorContext(): Promise<PulsarThemeEditorContext | null> {
  const slug = (await headers()).get(GE_PULSAR_THEME_SLUG_HEADER);
  if (!slug) return null;
  const actor = await resolvePulsarSiteActor(slug);
  if (actor.kind !== "staff" && actor.kind !== "owner") return null;
  if (actor.kind === "staff" && actor.mustChangePassword) return null;
  const tenant = await loadPulsarTenantBySlugForAdmin(slug);
  if (!tenant) return null;
  enterTenant(tenant);
  const supabase = await createAdminClient();
  const actorId = actor.kind === "staff" && tenant.dataMode === "shared_schema" ? actor.userId : null;
  return {
    supabase,
    user: { id: actorId } as User,
  };
}
