"use server";

import { revalidatePath } from "next/cache";
import { closeInstituteDataPlane } from "@/lib/pulsar/closeInstituteDataPlane";
import { resolvePulsarSiteActor } from "@/lib/pulsar/pulsarSiteActor";
import {
  applyLocalMemoryTenantRemove,
  invalidateTenantRegistryCache,
  loadPulsarTenantBySlugForAdmin,
} from "@/lib/pulsar/pulsarTenantStore";
import {
  logServerActionException,
  logSupabaseError,
} from "@/lib/logging/serverActionLog";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export async function closePulsarTenantAction(args: {
  locale: string;
  slug: string;
  confirmSlug: string;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const actor = await resolvePulsarSiteActor(args.slug);
  if (actor.kind !== "staff" && actor.kind !== "owner") return { ok: false, errorCode: "unauthorized" };
  if (actor.kind === "staff" && actor.mustChangePassword) {
    return { ok: false, errorCode: "password_change_required" };
  }
  if (args.confirmSlug.trim().toLowerCase() !== args.slug.trim().toLowerCase()) {
    return { ok: false, errorCode: "slug_mismatch" };
  }

  try {
    const tenant = await loadPulsarTenantBySlugForAdmin(args.slug);
    if (!tenant) return { ok: false, errorCode: "invalid_slug" };

    const closed = await closeInstituteDataPlane(tenant);
    if (!closed.ok) return closed;

    if (isPulsarSupabaseConfigured()) {
      const admin = createPulsarAdminClient();
      const { error } = await admin.from("platform_tenants").delete().eq("slug", tenant.slug);
      if (error) {
        logSupabaseError("closePulsarTenantAction:delete", error, { slug: tenant.slug });
        return { ok: false, errorCode: "db_write_failed" };
      }
      await admin.from("platform_audit_log").insert({
        actor_user_id: actor.userId,
        actor_email: actor.email,
        action: "tenant.close",
        tenant_slug: tenant.slug,
        changed_fields: ["deleted"],
      });
      invalidateTenantRegistryCache();
    } else {
      applyLocalMemoryTenantRemove(tenant.slug);
    }

    revalidatePath(`/${args.locale}/admin`);
    revalidatePath(`/${args.locale}/cuenta`);
    revalidatePath(`/${args.locale}`);
    return { ok: true };
  } catch (err) {
    logServerActionException("closePulsarTenantAction", err, { slug: args.slug });
    return { ok: false, errorCode: "db_write_failed" };
  }
}
