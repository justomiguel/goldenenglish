import { describe, expect, it } from "vitest";
import { DEFAULT_PULSAR_HOSTS } from "@/lib/tenant/tenantRegistry";
import {
  mergeTenantPreviewHosts,
  previewHostsForTenantSlug,
  tenantSlugFromPulsarSubdomain,
} from "@/lib/tenant/pulsarSubdomain";

describe("tenantSlugFromPulsarSubdomain", () => {
  const hosts = [...DEFAULT_PULSAR_HOSTS];

  it("reads the institute slug from a Pulsar preview subdomain", () => {
    expect(tenantSlugFromPulsarSubdomain("nago.centrolisto.cl", hosts)).toBe("nago");
    expect(tenantSlugFromPulsarSubdomain("acme.centrolisto.cl:443", hosts)).toBe("acme");
    expect(tenantSlugFromPulsarSubdomain("nago.pulsarlab.cl", hosts)).toBe("nago");
    expect(tenantSlugFromPulsarSubdomain("nago.pulsarlab.vercel.app", hosts)).toBe("nago");
  });

  it("reads the institute slug from {slug}.localhost", () => {
    expect(tenantSlugFromPulsarSubdomain("nago.localhost:3000", hosts)).toBe("nago");
    expect(tenantSlugFromPulsarSubdomain("mozarthitos.localhost", hosts)).toBe("mozarthitos");
  });

  it("marks pulsar.localhost and pulsar.{apex} as the platform", () => {
    expect(tenantSlugFromPulsarSubdomain("pulsar.localhost:3000", hosts)).toBe("pulsar");
    expect(tenantSlugFromPulsarSubdomain("pulsar.centrolisto.cl", hosts)).toBe("pulsar");
  });

  it("returns null for Pulsar apex hosts, bare localhost, and custom domains", () => {
    expect(tenantSlugFromPulsarSubdomain("centrolisto.cl", hosts)).toBeNull();
    expect(tenantSlugFromPulsarSubdomain("www.centrolisto.cl", hosts)).toBeNull();
    expect(tenantSlugFromPulsarSubdomain("localhost:3000", hosts)).toBeNull();
    expect(tenantSlugFromPulsarSubdomain("127.0.0.1:3000", hosts)).toBeNull();
    expect(tenantSlugFromPulsarSubdomain("capoeiranago.cl", hosts)).toBeNull();
    expect(tenantSlugFromPulsarSubdomain("www.nago.centrolisto.cl", hosts)).toBeNull();
    expect(tenantSlugFromPulsarSubdomain(null, hosts)).toBeNull();
  });
});

describe("previewHostsForTenantSlug", () => {
  const hosts = [...DEFAULT_PULSAR_HOSTS];

  it("adds {slug}.{apex} for each Pulsar apex and strips www", () => {
    expect(previewHostsForTenantSlug("nago", hosts)).toEqual([
      "nago.centrolisto.cl",
      "nago.pulsarlab.cl",
      "nago.pulsarlab.vercel.app",
    ]);
  });

  it("merges preview hosts without dropping custom domains or writing localhost", () => {
    expect(
      mergeTenantPreviewHosts(["capoeiranago.cl", "nago.centrolisto.cl"], "nago", hosts),
    ).toEqual([
      "capoeiranago.cl",
      "nago.centrolisto.cl",
      "nago.pulsarlab.cl",
      "nago.pulsarlab.vercel.app",
    ]);
    expect(previewHostsForTenantSlug("pulsar", hosts)).toEqual([]);
    expect(previewHostsForTenantSlug("nago", ["localhost", "www.centrolisto.cl"])).toEqual([
      "nago.centrolisto.cl",
    ]);
  });
});
