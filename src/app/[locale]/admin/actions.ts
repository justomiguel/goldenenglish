"use server";

import { revalidatePath } from "next/cache";
import {
  logServerActionException,
  logServerInfo,
  logSupabaseError,
} from "@/lib/logging/serverActionLog";
import { probeSingleTenantConnection } from "@/lib/pulsar/loadPulsarFleetTelemetry";
import { finishStaffTenantSave } from "@/lib/pulsar/finishStaffTenantSave";
import { getPulsarStaffSession, type PulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { mapPulsarTenantToDbPayload } from "@/lib/pulsar/pulsarTenantMapper";
import { prepareInstituteDataPlane } from "@/lib/pulsar/provisionSharedInstituteSchema";
import {
  validatePulsarPlatformHostsInput,
  validatePulsarTenantInput,
} from "@/lib/pulsar/pulsarTenantSchema";
import {
  applyLocalMemoryPulsarHosts,
  applyLocalMemoryTenantUpsert,
  invalidateTenantRegistryCache,
  loadAllPulsarTenantsForAdmin,
  loadPulsarPlatformHostsForAdmin,
} from "@/lib/pulsar/pulsarTenantStore";
import {
  createPulsarAdminClient,
  isPulsarSupabaseConfigured,
  readSharedPulsarCredentials,
} from "@/lib/supabase/pulsar";

function passwordChangeBlock(
  session: PulsarStaffSession,
): { ok: false; errorCode: "password_change_required" } | null {
  if (!session.mustChangePassword) return null;
  return { ok: false, errorCode: "password_change_required" };
}

function revalidatePulsarAdminPaths(locale: string, slug?: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/clientes`);
  revalidatePath(`/${locale}/admin`);
  if (slug) {
    revalidatePath(`/${locale}/admin/tenants/${slug}`);
  }
}

export async function testPulsarTenantConnectionAction(args: {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}): Promise<{ ok: boolean; latencyMs: number; errorCode: string | null }> {
  const session = await getPulsarStaffSession();
  if (!session) {
    return { ok: false, latencyMs: 0, errorCode: "unauthorized" };
  }
  const blocked = passwordChangeBlock(session);
  if (blocked) return { ok: false, latencyMs: 0, errorCode: blocked.errorCode };
  return probeSingleTenantConnection(args.supabaseUrl, args.supabaseServiceRoleKey);
}

export async function savePulsarTenantAction(args: {
  locale: string;
  editingSlug?: string;
  payload: Record<string, unknown>;
}): Promise<{ ok: true; slug: string } | { ok: false; errorCode: string }> {
  const session = await getPulsarStaffSession();
  if (!session) {
    return { ok: false, errorCode: "unauthorized" };
  }
  const blocked = passwordChangeBlock(session);
  if (blocked) return blocked;

  try {
    const existing = await loadAllPulsarTenantsForAdmin();
    const validated = validatePulsarTenantInput(
      args.payload,
      existing,
      args.editingSlug,
      readSharedPulsarCredentials(),
    );
    if (!validated.ok) {
      return validated;
    }

    const record = validated.value;
    const prepared = await prepareInstituteDataPlane(record);
    if (!prepared.ok) return prepared;
    if (isPulsarSupabaseConfigured()) {
      const admin = createPulsarAdminClient();
      const dbRow = mapPulsarTenantToDbPayload(record);
      if (!prepared.pulsarDatabaseUrl) {
        delete dbRow.data_mode;
        delete dbRow.postgres_schema;
      }
      const { error } = await admin
        .from("platform_tenants")
        .upsert(dbRow, { onConflict: "slug" });
      if (error) {
        logSupabaseError("savePulsarTenantAction:upsert", error, { slug: record.slug });
        return { ok: false, errorCode: "db_write_failed" };
      }
      await admin.from("platform_audit_log").insert({
        actor_user_id: session.userId,
        actor_email: session.email,
        action: args.editingSlug ? "tenant.update" : "tenant.create",
        tenant_slug: record.slug,
        changed_fields: Object.keys(args.payload),
      });
      invalidateTenantRegistryCache();
      await loadAllPulsarTenantsForAdmin();
    } else {
      applyLocalMemoryTenantUpsert(record);
    }

    logServerInfo("savePulsarTenantAction:saved", {
      slug: record.slug,
      actorUserId: session.userId,
      mode: session.mode,
    });
    revalidatePulsarAdminPaths(args.locale, record.slug);
    return finishStaffTenantSave(record);
  } catch (err) {
    logServerActionException("savePulsarTenantAction:catch", err);
    return { ok: false, errorCode: "db_write_failed" };
  }
}

export async function togglePulsarTenantEnabledAction(args: {
  locale: string;
  slug: string;
  isEnabled: boolean;
}): Promise<{ ok: boolean; errorCode?: string }> {
  const session = await getPulsarStaffSession();
  if (!session) {
    return { ok: false, errorCode: "unauthorized" };
  }
  const blocked = passwordChangeBlock(session);
  if (blocked) return blocked;

  try {
    const existing = await loadAllPulsarTenantsForAdmin();
    const target = existing.find((t) => t.slug === args.slug);
    if (!target) {
      return { ok: false, errorCode: "invalid_slug" };
    }

    const updated = { ...target, isEnabled: args.isEnabled };
    if (isPulsarSupabaseConfigured()) {
      const admin = createPulsarAdminClient();
      const { error } = await admin
        .from("platform_tenants")
        .update({ is_enabled: args.isEnabled, updated_at: new Date().toISOString() })
        .eq("slug", args.slug);
      if (error) {
        logSupabaseError("togglePulsarTenantEnabledAction:update", error, { slug: args.slug });
        return { ok: false, errorCode: "db_write_failed" };
      }
      await admin.from("platform_audit_log").insert({
        actor_user_id: session.userId,
        actor_email: session.email,
        action: "tenant.toggle_enabled",
        tenant_slug: args.slug,
        changed_fields: ["is_enabled"],
      });
      invalidateTenantRegistryCache();
      await loadAllPulsarTenantsForAdmin();
    } else {
      applyLocalMemoryTenantUpsert(updated);
    }

    revalidatePulsarAdminPaths(args.locale, args.slug);
    return { ok: true };
  } catch (err) {
    logServerActionException("togglePulsarTenantEnabledAction:catch", err);
    return { ok: false, errorCode: "db_write_failed" };
  }
}

export async function savePulsarPlatformHostsAction(args: {
  locale: string;
  rawHosts: string;
}): Promise<{ ok: true; hosts: string[] } | { ok: false; errorCode: string }> {
  const session = await getPulsarStaffSession();
  if (!session) {
    return { ok: false, errorCode: "unauthorized" };
  }
  const blocked = passwordChangeBlock(session);
  if (blocked) return blocked;

  try {
    const existing = await loadAllPulsarTenantsForAdmin();
    const validated = validatePulsarPlatformHostsInput(args.rawHosts, existing);
    if (!validated.ok) {
      return validated;
    }

    const hosts = validated.hosts;
    if (isPulsarSupabaseConfigured()) {
      const admin = createPulsarAdminClient();
      const { error } = await admin.from("platform_settings").upsert(
        {
          id: "default",
          pulsar_hosts: hosts,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (error) {
        logSupabaseError("savePulsarPlatformHostsAction:upsert", error);
        return { ok: false, errorCode: "db_write_failed" };
      }
      await admin.from("platform_audit_log").insert({
        actor_user_id: session.userId,
        actor_email: session.email,
        action: "platform.hosts_update",
        tenant_slug: "pulsar",
        changed_fields: ["pulsar_hosts"],
      });
      invalidateTenantRegistryCache();
      await loadPulsarPlatformHostsForAdmin();
    } else {
      applyLocalMemoryPulsarHosts(hosts);
    }

    logServerInfo("savePulsarPlatformHostsAction:saved", {
      actorUserId: session.userId,
      hostCount: hosts.length,
    });
    revalidatePulsarAdminPaths(args.locale);
    return { ok: true, hosts };
  } catch (err) {
    logServerActionException("savePulsarPlatformHostsAction:catch", err);
    return { ok: false, errorCode: "db_write_failed" };
  }
}
