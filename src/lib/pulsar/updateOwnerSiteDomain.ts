import "server-only";

import { logServerActionException, logSupabaseError } from "@/lib/logging/serverActionLog";
import { detachVercelProjectDomain } from "@/lib/pulsar/attachVercelDomain";
import { finishStaffTenantSave } from "@/lib/pulsar/finishStaffTenantSave";
import { hostOnly } from "@/lib/pulsar/ownerSiteLinks";
import { loadAllPulsarTenantsForAdmin, loadPulsarPlatformHostsForAdmin, invalidateTenantRegistryCache } from "@/lib/pulsar/pulsarTenantStore";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";
import { previewHostsForTenantSlug } from "@/lib/tenant/pulsarSubdomain";
import { isPulsarHost, normalizeHost } from "@/lib/tenant/tenantRegistry";

export async function updateOwnerSiteDomain(input: {
  userId: string;
  email: string;
  slug: string;
  customDomain: string;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const slug = input.slug.trim().toLowerCase();
  const customHost = normalizeHost(hostOnly(input.customDomain));
  if (customHost && (!customHost.includes(".") || customHost.includes(" ") || isPulsarHost(customHost))) {
    return { ok: false, errorCode: "invalid_domain" };
  }

  const admin = createPulsarAdminClient();
  const { data: owner, error: ownerErr } = await admin
    .from("platform_owners")
    .select("status")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (ownerErr || owner?.status !== "approved") return { ok: false, errorCode: "owner_not_approved" };

  const { data: link, error: linkErr } = await admin
    .from("platform_tenant_owners")
    .select("tenant_slug")
    .eq("tenant_slug", slug)
    .eq("owner_user_id", input.userId)
    .maybeSingle();
  if (linkErr || !link) return { ok: false, errorCode: "forbidden" };

  const platformHosts = await loadPulsarPlatformHostsForAdmin();
  const previewHosts = previewHostsForTenantSlug(slug, platformHosts);
  const customIsPreview = previewHosts.some((host) => normalizeHost(host) === customHost);
  const nextHosts = customHost && !customIsPreview ? [...previewHosts, customHost] : previewHosts;
  const existing = await loadAllPulsarTenantsForAdmin();
  const taken = existing.some(
    (tenant) => tenant.slug !== slug && tenant.hosts.some((host) => normalizeHost(host) === customHost),
  );
  if (customHost && taken) return { ok: false, errorCode: "duplicate_host" };

  const { error } = await admin
    .from("platform_tenants")
    .update({ hosts: nextHosts, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) {
    logSupabaseError("updateOwnerSiteDomain", error, { slug });
    return { ok: false, errorCode: "db_write_failed" };
  }
  invalidateTenantRegistryCache();

  const previous = existing.find((tenant) => tenant.slug === slug)?.hosts ?? [];
  const preview = new Set(previewHosts.map((host) => normalizeHost(host)));
  const kept = new Set(nextHosts.map((host) => normalizeHost(host)));
  for (const host of previous) {
    const normalized = normalizeHost(host);
    if (!normalized || preview.has(normalized) || kept.has(normalized)) continue;
    const detached = await detachVercelProjectDomain({
      token: process.env.VERCEL_TOKEN?.trim() ?? "",
      projectId: process.env.VERCEL_PROJECT_ID?.trim() ?? "",
      teamId: process.env.VERCEL_TEAM_ID,
      domain: normalized,
    });
    if (!detached.ok) return detached;
  }

  try {
    await admin.from("platform_audit_log").insert({
      actor_user_id: input.userId,
      actor_email: input.email,
      action: "tenant.domain",
      tenant_slug: slug,
      changed_fields: ["hosts"],
    });
  } catch (err) {
    logServerActionException("updateOwnerSiteDomain:audit", err, { slug });
  }

  const attached = await finishStaffTenantSave({ slug, hosts: nextHosts });
  if (!attached.ok) return attached;
  return { ok: true };
}
