import "server-only";

import { z } from "zod";
import { logServerWarn, logSupabaseError } from "@/lib/logging/serverActionLog";
import { activateFreeSiteTheme } from "@/lib/pulsar/activateFreeSiteTheme";
import { finishStaffTenantSave } from "@/lib/pulsar/finishStaffTenantSave";
import { writeInstituteSchemaProvisionPhase } from "@/lib/pulsar/instituteSchemaProvisionProgress";
import { optionalOwnerDomain } from "@/lib/pulsar/ownerSiteLinks";
import { ownerSiteSlug } from "@/lib/pulsar/ownerSiteSlug";
import { freeSiteCreateError } from "@/lib/pulsar/freeSitePlan";
import { ownerMayCreateFreeSite } from "@/lib/pulsar/pulsarStartPath";
import { mailSiteCreated } from "@/lib/pulsar/pulsarOwnerMail";
import { mapPulsarTenantToDbPayload } from "@/lib/pulsar/pulsarTenantMapper";
import { prepareInstituteDataPlane } from "@/lib/pulsar/provisionSharedInstituteSchema";
import { closeInstituteDataPlane } from "@/lib/pulsar/closeInstituteDataPlane";
import { validatePulsarTenantInput } from "@/lib/pulsar/pulsarTenantSchema";
import {
  invalidateTenantRegistryCache,
  loadAllPulsarTenantsForAdmin,
} from "@/lib/pulsar/pulsarTenantStore";
import { createPulsarAdminClient, isPulsarSupabaseConfigured, readSharedPulsarCredentials } from "@/lib/supabase/pulsar";
import { isPulsarHost } from "@/lib/tenant/tenantRegistry";
import { genericThemeSlug, isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { freeSiteShareProperties } from "@/lib/pulsar/freeSiteShare";
import { parseTemplatePalette, templatePaletteOverrides } from "@/lib/theme/templatePalette";

const createSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{0,62})$/),
  kind: z.string(),
  customDomain: z.string().trim().max(253).optional(),
  colorPrimary: z.string().trim().max(7).optional(),
  colorAccent: z.string().trim().max(7).optional(),
  colorPaper: z.string().trim().max(7).optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(200).optional(),
  instagram: z.string().trim().max(200).optional(),
  facebook: z.string().trim().max(200).optional(),
  address: z.string().trim().max(180).optional(),
});

export async function createOwnerFreeSite(input: {
  userId: string;
  email: string;
  displayName: string;
  slug: string;
  kind: string;
  locale: string;
  customDomain?: string;
  colorPrimary?: string;
  colorAccent?: string;
  colorPaper?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  address?: string;
}): Promise<{ ok: true; slug: string } | { ok: false; errorCode: string }> {
  const customDomain = optionalOwnerDomain(input.customDomain ?? "", isPulsarHost);
  const slug = ownerSiteSlug(input.slug);
  if (!slug) {
    logServerWarn("createOwnerFreeSite", { errorCode: "slug_invalid" });
    return { ok: false, errorCode: "slug_invalid" };
  }
  const parsed = createSchema.safeParse({ ...input, customDomain, slug });
  if (!parsed.success || !isGenericInstituteKind(parsed.data.kind)) {
    logServerWarn("createOwnerFreeSite", {
      errorCode: "invalid_input",
      fields: parsed.success ? ["kind"] : parsed.error.issues.map((issue) => issue.path.join(".")),
    });
    return { ok: false, errorCode: "invalid_input" };
  }
  if (!isPulsarSupabaseConfigured()) {
    logServerWarn("createOwnerFreeSite", { errorCode: "not_configured" });
    return { ok: false, errorCode: "not_configured" };
  }

  const admin = createPulsarAdminClient();
  const { data: ownerRow, error: ownerStatusErr } = await admin
    .from("platform_owners")
    .select("status")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (ownerStatusErr || !ownerMayCreateFreeSite(ownerRow?.status)) {
    logServerWarn("createOwnerFreeSite", { errorCode: "owner_not_approved" });
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

  const customHost = parsed.data.customDomain ?? "";
  const planError = freeSiteCreateError({
    ownedCount: count ?? 0,
    dataMode: "shared_schema",
    brandThemeSlug: genericThemeSlug(parsed.data.kind),
  });
  if (planError) {
    logServerWarn("createOwnerFreeSite", { errorCode: planError });
    return { ok: false, errorCode: planError };
  }

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
  if (!validated.ok) {
    logServerWarn("createOwnerFreeSite", { errorCode: validated.errorCode });
    return validated;
  }

  const record = validated.value;
  const prepared = await prepareInstituteDataPlane(record, input.userId);
  if (!prepared.ok) {
    logServerWarn("createOwnerFreeSite", { errorCode: prepared.errorCode });
    return prepared;
  }

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

  const palette = parseTemplatePalette({
    primary: parsed.data.colorPrimary,
    accent: parsed.data.colorAccent,
    paper: parsed.data.colorPaper,
  });
  const share = freeSiteShareProperties({
    email: input.email,
    phone: parsed.data.phone ?? "",
    whatsapp: parsed.data.whatsapp ?? "",
    instagram: parsed.data.instagram ?? "",
    facebook: parsed.data.facebook ?? "",
    address: parsed.data.address ?? "",
    displayName: parsed.data.displayName,
  });
  if (record.databaseUrl && record.postgresSchema) {
    await writeInstituteSchemaProvisionPhase({
      databaseUrl: record.databaseUrl,
      schema: record.postgresSchema,
      status: "running",
      phase: "theme",
    });
    const activated = await activateFreeSiteTheme({
      databaseUrl: record.databaseUrl,
      schema: record.postgresSchema,
      themeSlug: genericThemeSlug(parsed.data.kind),
      properties: { ...(palette ? templatePaletteOverrides(palette) : {}), ...share },
    });
    if (!activated.ok) {
      logServerWarn("createOwnerFreeSite", { errorCode: activated.errorCode, slug: record.slug });
    }
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
  if (!attached.ok) {
    logServerWarn("createOwnerFreeSite", { errorCode: attached.errorCode });
    return attached;
  }
  await mailSiteCreated({
    email: input.email,
    locale: input.locale,
    name: parsed.data.displayName,
    slug: record.slug,
  });
  return { ok: true, slug: record.slug };
}
