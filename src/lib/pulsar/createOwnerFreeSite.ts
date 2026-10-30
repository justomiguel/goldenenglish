import "server-only";

import { z } from "zod";
import { logServerActionException, logSupabaseError } from "@/lib/logging/serverActionLog";
import { finishStaffTenantSave } from "@/lib/pulsar/finishStaffTenantSave";
import { hostOnly } from "@/lib/pulsar/ownerSiteLinks";
import { freeSiteCreateError } from "@/lib/pulsar/freeSitePlan";
import { mailSiteCreated } from "@/lib/pulsar/pulsarOwnerMail";
import { mapPulsarTenantToDbPayload } from "@/lib/pulsar/pulsarTenantMapper";
import { prepareInstituteDataPlane } from "@/lib/pulsar/provisionSharedInstituteSchema";
import { closeInstituteDataPlane } from "@/lib/pulsar/closeInstituteDataPlane";
import { validatePulsarTenantInput } from "@/lib/pulsar/pulsarTenantSchema";
import {
  invalidateTenantRegistryCache,
  loadAllPulsarTenantsForAdmin,
} from "@/lib/pulsar/pulsarTenantStore";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPulsarAdminClient, isPulsarSupabaseConfigured, readSharedPulsarCredentials } from "@/lib/supabase/pulsar";
import { enterTenant } from "@/lib/tenant/tenantAls";
import { genericThemeSlug, isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";

const createSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{0,62})$/),
  kind: z.string(),
  customDomain: z.string().trim().max(253).optional(),
});

export async function createOwnerFreeSite(input: {
  userId: string;
  email: string;
  displayName: string;
  slug: string;
  kind: string;
  locale: string;
  customDomain?: string;
}): Promise<{ ok: true; slug: string } | { ok: false; errorCode: string }> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success || !isGenericInstituteKind(parsed.data.kind)) {
    return { ok: false, errorCode: "invalid_input" };
  }
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };

  const admin = createPulsarAdminClient();
  const { data: ownerRow, error: ownerStatusErr } = await admin
    .from("platform_owners")
    .select("status")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (ownerStatusErr || ownerRow?.status !== "approved") {
    return { ok: false, errorCode: "owner_not_approved" };
  }
  const { count, error: countErr } = await admin
    .from("platform_tenant_owners")
    .select("tenant_slug", { count: "exact", head: true })
    .eq("owner_user_id", input.userId);
  if (countErr) {
    logSupabaseError("createOwnerFreeSite:count", countErr, { userId: input.userId });
    return { ok: false, errorCode: "create_failed" };
  }

  const customHost = hostOnly(parsed.data.customDomain ?? "");
  const planError = freeSiteCreateError({
    ownedCount: count ?? 0,
    dataMode: "shared_schema",
    brandThemeSlug: genericThemeSlug(parsed.data.kind),
  });
  if (planError) return { ok: false, errorCode: planError };

  const existing = await loadAllPulsarTenantsForAdmin();
  const validated = validatePulsarTenantInput(
    {
      slug: parsed.data.slug,
      displayName: parsed.data.displayName,
      isEnabled: true,
      hosts: customHost ? [customHost] : [],
      dataMode: "shared_schema",
      brandThemeSlug: genericThemeSlug(parsed.data.kind),
      skipInitialSiteSetup: true,
    },
    existing,
    undefined,
    readSharedPulsarCredentials(),
  );
  if (!validated.ok) return validated;

  const record = validated.value;
  const prepared = await prepareInstituteDataPlane(record);
  if (!prepared.ok) return prepared;

  const dbRow = mapPulsarTenantToDbPayload(record);
  const { error: upsertErr } = await admin.from("platform_tenants").upsert(dbRow, { onConflict: "slug" });
  if (upsertErr) {
    logSupabaseError("createOwnerFreeSite:tenant", upsertErr, { slug: record.slug });
    return { ok: false, errorCode: "create_failed" };
  }

  const { error: ownerErr } = await admin.from("platform_tenant_owners").insert({
    tenant_slug: record.slug,
    owner_user_id: input.userId,
    plan: "free",
  });
  if (ownerErr) {
    logSupabaseError("createOwnerFreeSite:owner", ownerErr, { slug: record.slug });
    await closeInstituteDataPlane({ ...record, updatedAt: null });
    await admin.from("platform_tenants").delete().eq("slug", record.slug);
    return { ok: false, errorCode: "create_failed" };
  }

  try {
    enterTenant(record);
    const institute = await createAdminClient();
    const themeSlug = genericThemeSlug(parsed.data.kind);
    await institute.from("site_themes").update({ is_active: false }).neq("slug", themeSlug);
    await institute.from("site_themes").update({ is_active: true }).eq("slug", themeSlug).is("archived_at", null);
  } catch (err) {
    logServerActionException("createOwnerFreeSite:theme", err, { slug: record.slug });
  }

  await admin.from("platform_audit_log").insert({
    actor_user_id: input.userId,
    actor_email: input.email,
    action: "tenant.create",
    tenant_slug: record.slug,
    changed_fields: ["free_plan"],
  });
  invalidateTenantRegistryCache();
  const attached = await finishStaffTenantSave(record);
  if (!attached.ok) return attached;
  await mailSiteCreated({
    email: input.email,
    locale: input.locale,
    name: parsed.data.displayName,
    slug: record.slug,
  });
  return { ok: true, slug: record.slug };
}
