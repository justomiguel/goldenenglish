import { existsSync } from "node:fs";
import { join } from "node:path";
import { attachClientPreviewMedia } from "@/lib/pulsar/centrolistoClientPreviews";
import { loadAllPulsarTenantsForAdmin } from "@/lib/pulsar/pulsarTenantStore";

function publicAssetExists(publicPath: string): boolean {
  return existsSync(join(process.cwd(), "public", publicPath.replace(/^\//, "")));
}

export async function loadCentrolistoPublicClients() {
  const tenants = await loadAllPulsarTenantsForAdmin();
  return attachClientPreviewMedia(
    tenants
      .filter((tenant) => tenant.isEnabled)
      .map((tenant) => ({
        slug: tenant.slug,
        displayName: tenant.displayName,
        hosts: tenant.hosts,
        publicUrl: tenant.publicUrl,
      })),
    publicAssetExists,
  );
}
