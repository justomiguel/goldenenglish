import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  GE_TENANT_HEADER,
  getPulsarHosts,
  isDynamicPulsarHostsCacheLoaded,
  isPulsarHost,
  isPulsarRequestFromHeaderGet,
  listTenants,
  resolveTenantByHost,
  setDynamicPulsarHostsCache,
  setDynamicTenantsCache,
  tenantFromHeaderGet,
  tenantHostBlockStatus,
  type TenantConfig,
} from "@/lib/tenant/tenantRegistry";

const SAMPLE_TENANT: TenantConfig = {
  slug: "nago",
  hosts: ["capoeiranago.cl"],
  supabaseUrl: "https://nago.supabase.co",
  supabaseAnonKey: "anon-nago",
  supabaseServiceRoleKey: "srv-nago",
  databaseUrl: null,
  brandThemeSlug: "nago",
  mailTenant: "capoeiranago.cl",
  resendFromEmail: null,
  resendApiKey: null,
  publicUrl: "https://capoeiranago.cl",
  paymentGatewaySecretEncryptionKey: null,
  whatsappAccessToken: null,
  whatsappPhoneNumberId: null,
  whatsappClassReminderTemplateName: null,
  vapidPublicKey: null,
  vapidPrivateKey: null,
  vapidContactEmail: null,
  googleMapsApiKey: null,
  googleMapsMapId: null,
  kvRestApiUrl: null,
  kvRestApiToken: null,
  debugLogin: false,
  skipInitialSiteSetup: false,
};

// REGRESSION CHECK: Changing Pulsar host resolution to support DB-backed platform_settings.pulsar_hosts
// must preserve fallback to PULSAR_HOSTS and DEFAULT_PULSAR_HOSTS when DB cache is null.
describe("Pulsar host resolution and dynamic tenant cache", () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    setDynamicTenantsCache(null);
    setDynamicPulsarHostsCache(null);
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([SAMPLE_TENANT]);
    delete process.env.DEV_TENANT_SLUG;
    delete process.env.PULSAR_HOSTS;
  });

  afterEach(() => {
    setDynamicTenantsCache(null);
    setDynamicPulsarHostsCache(null);
    process.env = { ...prevEnv };
  });

  it("identifies pulsarlab.cl, www.pulsarlab.cl, and centrolisto.cl as Pulsar platform hosts", () => {
    expect(isPulsarHost("pulsarlab.cl")).toBe(true);
    expect(isPulsarHost("www.pulsarlab.cl:443")).toBe(true);
    expect(isPulsarHost("pulsarlab.vercel.app")).toBe(true);
    expect(isPulsarHost("centrolisto.cl")).toBe(true);
    expect(isPulsarHost("www.centrolisto.cl:443")).toBe(true);
    expect(isPulsarHost("capoeiranago.cl")).toBe(false);
  });

  it("detects Pulsar requests from Host, x-ge-tenant, and localhost DEV_TENANT_SLUG=pulsar", () => {
    expect(
      isPulsarRequestFromHeaderGet((name) => (name === "host" ? "pulsarlab.cl" : null)),
    ).toBe(true);

    expect(
      isPulsarRequestFromHeaderGet((name) =>
        name === GE_TENANT_HEADER ? "pulsar" : name === "host" ? "localhost:3000" : null,
      ),
    ).toBe(true);

    process.env.DEV_TENANT_SLUG = "pulsar";
    expect(
      isPulsarRequestFromHeaderGet((name) => (name === "host" ? "localhost:3000" : null)),
    ).toBe(true);

    process.env.DEV_TENANT_SLUG = "nago";
    expect(
      isPulsarRequestFromHeaderGet((name) => (name === "host" ? "localhost:3000" : null)),
    ).toBe(false);
  });

  it("does not block pulsarlab.cl with 404 when multi-tenant mode is enabled", () => {
    const status = tenantHostBlockStatus(
      (name) => (name === "host" ? "pulsarlab.cl" : null),
      "/es",
    );
    expect(status).toBeNull();
    expect(
      tenantHostBlockStatus(
        (name) => (name === "host" ? "pulsarlab.vercel.app" : null),
        "/es",
      ),
    ).toBeNull();
    expect(
      tenantHostBlockStatus(
        (name) => (name === "host" ? "centrolisto.cl" : null),
        "/es",
      ),
    ).toBeNull();
    expect(
      tenantHostBlockStatus(
        (name) => (name === "host" ? "www.centrolisto.cl" : null),
        "/es",
      ),
    ).toBeNull();
  });

  it("serves dynamic DB tenants when cache is populated without redeploying env", () => {
    const dynamicTenant: TenantConfig = {
      ...SAMPLE_TENANT,
      slug: "nuevo",
      hosts: ["nuevo.cl"],
      supabaseUrl: "https://nuevo.supabase.co",
    };
    setDynamicTenantsCache([dynamicTenant]);

    expect(listTenants().map((t) => t.slug)).toEqual(["nuevo"]);
    expect(resolveTenantByHost("nuevo.cl")?.supabaseUrl).toBe("https://nuevo.supabase.co");
    expect(resolveTenantByHost("capoeiranago.cl")).toBeNull();
  });

  it("overrides Pulsar hosts completely when dynamicPulsarHosts is loaded from DB", () => {
    expect(isDynamicPulsarHostsCacheLoaded()).toBe(false);
    process.env.PULSAR_HOSTS = "env-pulsar.cl";

    setDynamicPulsarHostsCache(["  PulsarHQ.cl:443 ", "admin.pulsarlab.cl"]);

    expect(isDynamicPulsarHostsCacheLoaded()).toBe(true);
    expect(getPulsarHosts()).toEqual(["pulsarhq.cl", "admin.pulsarlab.cl"]);
    expect(isPulsarHost("pulsarhq.cl")).toBe(true);
    expect(isPulsarHost("admin.pulsarlab.cl")).toBe(true);
    expect(isPulsarHost("env-pulsar.cl")).toBe(false);
    expect(isPulsarHost("pulsarlab.cl")).toBe(false);
  });

  it("binds {slug}.localhost and {slug}.centrolisto.cl from the Pulsar cache", () => {
    setDynamicTenantsCache([SAMPLE_TENANT]);
    expect(
      tenantFromHeaderGet((name) => (name === "host" ? "nago.localhost:3000" : null))?.slug,
    ).toBe("nago");
    expect(
      tenantFromHeaderGet((name) => (name === "host" ? "nago.centrolisto.cl" : null))?.slug,
    ).toBe("nago");
    expect(
      tenantFromHeaderGet((name) => (name === "host" ? "acme.centrolisto.cl" : null)),
    ).toBeNull();
    expect(
      isPulsarRequestFromHeaderGet((name) =>
        name === "host" ? "pulsar.localhost:3000" : null,
      ),
    ).toBe(true);
    expect(
      isPulsarRequestFromHeaderGet((name) => (name === "host" ? "centrolisto.cl" : null)),
    ).toBe(true);
    expect(
      tenantHostBlockStatus(
        (name) => (name === "host" ? "foo.localhost:3000" : null),
        "/es",
      ),
    ).toBe(404);
    expect(
      tenantHostBlockStatus(
        (name) => (name === "host" ? "nago.localhost:3000" : null),
        "/es",
      ),
    ).toBeNull();
  });
});
