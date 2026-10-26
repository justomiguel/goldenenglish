import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  GE_TENANT_HEADER,
  isPulsarHost,
  isPulsarRequestFromHeaderGet,
  listTenants,
  resolveTenantByHost,
  setDynamicTenantsCache,
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

describe("Pulsar host resolution and dynamic tenant cache", () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    setDynamicTenantsCache(null);
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([SAMPLE_TENANT]);
    delete process.env.DEV_TENANT_SLUG;
    delete process.env.PULSAR_HOSTS;
  });

  afterEach(() => {
    setDynamicTenantsCache(null);
    process.env = { ...prevEnv };
  });

  it("identifies pulsarlab.cl and www.pulsarlab.cl as Pulsar platform hosts", () => {
    expect(isPulsarHost("pulsarlab.cl")).toBe(true);
    expect(isPulsarHost("www.pulsarlab.cl:443")).toBe(true);
    expect(isPulsarHost("pulsarlab.vercel.app")).toBe(true);
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
});
