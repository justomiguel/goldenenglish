import "server-only";

import { attachStaffExtraHosts } from "@/lib/pulsar/attachVercelDomain";
import { loadPulsarPlatformHostsForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { previewHostsForTenantSlug } from "@/lib/tenant/pulsarSubdomain";

export async function finishStaffTenantSave(record: {
  slug: string;
  hosts: readonly string[];
}): Promise<{ ok: true; slug: string } | { ok: false; errorCode: string }> {
  const platformHosts = await loadPulsarPlatformHostsForAdmin();
  return attachStaffExtraHosts({
    slug: record.slug,
    hosts: record.hosts,
    previewHosts: previewHostsForTenantSlug(record.slug, platformHosts),
  });
}
