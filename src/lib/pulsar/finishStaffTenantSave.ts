import "server-only";

import { attachStaffExtraHosts } from "@/lib/pulsar/attachVercelDomain";
import { writeInstituteSchemaProvisionPhase } from "@/lib/pulsar/instituteSchemaProvisionProgress";

export async function finishStaffTenantSave(record: {
  slug: string;
  hosts: readonly string[];
  databaseUrl?: string | null;
  postgresSchema?: string | null;
}): Promise<{ ok: true; slug: string } | { ok: false; errorCode: string }> {
  const databaseUrl = record.databaseUrl?.trim() ?? "";
  const schema = record.postgresSchema?.trim() ?? "";
  const phase = (status: string, name: string, fileName?: string | null) =>
    writeInstituteSchemaProvisionPhase({ databaseUrl, schema, status, phase: name, fileName });

  const attached = await attachStaffExtraHosts({
    slug: record.slug,
    hosts: record.hosts,
    onHost: (host) => phase("running", "domain", host),
  });
  if (!attached.ok) {
    await phase("failed", "domain");
    return attached;
  }
  await phase("succeeded", attached.domainStatus === "skipped" ? "domain_skipped" : "done");
  return { ok: true, slug: attached.slug };
}
