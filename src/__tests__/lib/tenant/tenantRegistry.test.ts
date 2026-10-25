import { describe, expect, it, afterEach } from "vitest";
import {
  getPulsarHosts,
  getTenantBySlug,
  isMultiTenantEnabled,
  isPulsarHost,
  isPulsarRequestFromHeaderGet,
  knownMailTenantDomains,
  normalizeHost,
  resolveTenantByHost,
  setDynamicTenantsCache,
  tenantFromHeaderGet,
  tenantHostBlockStatus,
  tenantPublicEnv,
  tenantRegistryError,
  type TenantConfig,
} from "@/lib/tenant/tenantRegistry";

const nago = {
  slug: "nago",
  hosts: ["capoeiranago.cl", "www.capoeiranago.cl"],
  supabaseUrl: "https://nago.supabase.co",
  supabaseAnonKey: "anon-nago",
  supabaseServiceRoleKey: "service-nago",
  mailTenant: "alumnos.nago.cl",
  publicUrl: "https://capoeiranago.cl",
};

const golden = {
  slug: "golden",
  hosts: ["goldenenglish.cl:443"],
  supabaseUrl: "https://golden.supabase.co",
  supabaseAnonKey: "anon-golden",
  supabaseServiceRoleKey: "service-golden",
};

const memoryTenant = {
    slug: "nago",
    hosts: ["capoeiranago.cl"],
    supabaseUrl: "https://nago.supabase.co",
    supabaseAnonKey: "anon-nago",
    supabaseServiceRoleKey: "service-nago",
    databaseUrl: null,
    brandThemeSlug: null,
    mailTenant: null,
    resendFromEmail: null,
    resendApiKey: null,
    publicUrl: null,
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
} satisfies TenantConfig;

describe("tenantRegistry", () => {
  const prev = process.env.TENANTS_CONFIG_JSON;
  const prevDev = process.env.DEV_TENANT_SLUG;
  const prevPulsarUrl = process.env.PULSAR_SUPABASE_URL;
  const prevPulsarKey = process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY;
  const prevPulsarHosts = process.env.PULSAR_HOSTS;

  afterEach(() => {
    setDynamicTenantsCache(null);
    if (prev === undefined) delete process.env.TENANTS_CONFIG_JSON;
    else process.env.TENANTS_CONFIG_JSON = prev;
    if (prevDev === undefined) delete process.env.DEV_TENANT_SLUG;
    else process.env.DEV_TENANT_SLUG = prevDev;
    if (prevPulsarUrl === undefined) delete process.env.PULSAR_SUPABASE_URL;
    else process.env.PULSAR_SUPABASE_URL = prevPulsarUrl;
    if (prevPulsarKey === undefined) delete process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY;
    else process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY = prevPulsarKey;
    if (prevPulsarHosts === undefined) delete process.env.PULSAR_HOSTS;
    else process.env.PULSAR_HOSTS = prevPulsarHosts;
  });

  it("stays disabled when the env var is unset", () => {
    delete process.env.TENANTS_CONFIG_JSON;
    expect(isMultiTenantEnabled()).toBe(false);
    expect(resolveTenantByHost("capoeiranago.cl")).toBeNull();
    expect(tenantRegistryError()).toBeNull();
  });

  it("matches a host and strips the port", () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([nago, golden]);
    expect(resolveTenantByHost("WWW.CapoeiraNago.cl:443")?.slug).toBe("nago");
    expect(resolveTenantByHost("goldenenglish.cl")?.supabaseUrl).toBe(
      "https://golden.supabase.co",
    );
    expect(normalizeHost("GoldenEnglish.cl.")).toBe("goldenenglish.cl");
  });

  it("does not put the service role in the public env", () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([nago]);
    const tenant = getTenantBySlug("nago");
    expect(tenant).not.toBeNull();
    expect(tenantPublicEnv(tenant!)).toEqual({
      url: "https://nago.supabase.co",
      anonKey: "anon-nago",
      origin: "https://capoeiranago.cl",
    });
    expect(JSON.stringify(tenantPublicEnv(tenant!))).not.toContain("service-nago");
  });

  it("stores the resend api key and keeps it off the public env", () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([
      {
        ...nago,
        databaseUrl: "postgresql://postgres:secret@db.nago.supabase.co:5432/postgres",
        resendApiKey: "re_nago",
        paymentGatewaySecretEncryptionKey: "enc_nago",
        whatsappAccessToken: "wa_secret",
        whatsappPhoneNumberId: "12345",
        whatsappClassReminderTemplateName: "class_reminder_es",
        vapidPublicKey: "vapid_pub",
        vapidPrivateKey: "vapid_priv",
        vapidContactEmail: "ops@nago.cl",
        googleMapsApiKey: "AIza_nago",
        googleMapsMapId: "map_nago",
        kvRestApiUrl: "https://kv.nago.test",
        kvRestApiToken: "kv_secret",
        debugLogin: true,
        skipInitialSiteSetup: true,
      },
    ]);
    const tenant = getTenantBySlug("nago");
    expect(tenant?.resendApiKey).toBe("re_nago");
    expect(tenant?.databaseUrl).toContain("db.nago.supabase.co");
    expect(tenant?.whatsappAccessToken).toBe("wa_secret");
    expect(tenant?.vapidPrivateKey).toBe("vapid_priv");
    expect(tenant?.paymentGatewaySecretEncryptionKey).toBe("enc_nago");
    expect(tenant?.kvRestApiToken).toBe("kv_secret");
    expect(tenant?.debugLogin).toBe(true);
    expect(tenant?.skipInitialSiteSetup).toBe(true);
    const pub = tenantPublicEnv(tenant!);
    expect(pub.googleMapsApiKey).toBe("AIza_nago");
    expect(pub.googleMapsMapId).toBe("map_nago");
    expect(pub.vapidPublicKey).toBe("vapid_pub");
    expect(pub.debugLogin).toBe(true);
    const serialized = JSON.stringify(pub);
    expect(serialized).not.toContain("re_nago");
    expect(serialized).not.toContain("wa_secret");
    expect(serialized).not.toContain("vapid_priv");
    expect(serialized).not.toContain("enc_nago");
    expect(serialized).not.toContain("kv_secret");
    expect(serialized).not.toContain("db.nago.supabase.co");
  });

  it("rejects duplicate hosts and invalid JSON", () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([
      nago,
      { ...golden, hosts: ["capoeiranago.cl"] },
    ]);
    expect(tenantRegistryError()).toBe("duplicate_host");
    expect(resolveTenantByHost("capoeiranago.cl")).toBeNull();

    process.env.TENANTS_CONFIG_JSON = "{";
    expect(tenantRegistryError()).toBe("invalid_json");
  });

  it("uses DEV_TENANT_SLUG on localhost and lists mail domains", () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([nago, golden]);
    process.env.DEV_TENANT_SLUG = "nago";
    expect(
      tenantFromHeaderGet((name) => (name === "host" ? "localhost:3000" : null))?.slug,
    ).toBe("nago");
    expect(knownMailTenantDomains()).toEqual(["alumnos.nago.cl"]);
    expect(
      tenantFromHeaderGet((name) => (name === "host" ? "evil.example" : null)),
    ).toBeNull();
  });

  it("blocks unknown production hosts and skips cron", () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([nago]);
    const host = (name: string) => (name === "host" ? "evil.example" : null);
    expect(tenantHostBlockStatus(host, "/es")).toBe(404);
    expect(tenantHostBlockStatus(host, "/api/cron/class-reminders")).toBeNull();
    expect(
      tenantHostBlockStatus(
        (name) => (name === "host" ? "localhost:3000" : null),
        "/es",
      ),
    ).toBeNull();

    process.env.TENANTS_CONFIG_JSON = "{";
    expect(tenantHostBlockStatus(host, "/es")).toBe(503);
    expect(tenantFromHeaderGet(host)).toBeNull();
  });

  it("treats Pulsar env, memory cache, and reserved hosts as the control plane", () => {
    delete process.env.TENANTS_CONFIG_JSON;
    process.env.PULSAR_SUPABASE_URL = "https://pulsar.supabase.co";
    process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY = "service-pulsar";
    expect(isMultiTenantEnabled()).toBe(true);

    delete process.env.PULSAR_SUPABASE_URL;
    delete process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY;
    setDynamicTenantsCache([memoryTenant]);
    expect(isMultiTenantEnabled()).toBe(true);
    expect(getTenantBySlug("nago")?.slug).toBe("nago");
    expect(tenantPublicEnv({ ...memoryTenant, hosts: [] }).origin).toBeNull();
    expect(tenantPublicEnv(memoryTenant).origin).toBe("https://capoeiranago.cl");

    expect(getPulsarHosts()).toEqual(["pulsarlab.cl", "www.pulsarlab.cl"]);
    process.env.PULSAR_HOSTS = " , ";
    expect(getPulsarHosts()).toEqual(["pulsarlab.cl", "www.pulsarlab.cl"]);
    process.env.PULSAR_HOSTS = "lab.example";
    expect(getPulsarHosts()).toEqual(["lab.example"]);
    expect(isPulsarHost(null)).toBe(false);
    expect(isPulsarHost("   ")).toBe(false);
    expect(isPulsarHost("lab.example")).toBe(true);

    delete process.env.DEV_TENANT_SLUG;
    expect(isPulsarRequestFromHeaderGet(() => null)).toBe(false);
    expect(
      isPulsarRequestFromHeaderGet((name) => (name === "x-ge-tenant" ? "pulsar" : null)),
    ).toBe(true);
    expect(
      isPulsarRequestFromHeaderGet((name) => (name === "x-ge-tenant" ? "nago" : "lab.example")),
    ).toBe(false);
    expect(resolveTenantByHost(null)).toBeNull();
    expect(resolveTenantByHost("lab.example")).toBeNull();
    expect(getTenantBySlug("")).toBeNull();
    expect(getTenantBySlug("pulsar")).toBeNull();

    const none = () => null;
    expect(tenantHostBlockStatus(none, "/es")).toBe(404);
    expect(tenantFromHeaderGet(none)).toBeNull();
    expect(
      tenantFromHeaderGet((name) => (name === "x-ge-tenant" ? "pulsar" : null)),
    ).toBeNull();
    expect(
      tenantFromHeaderGet((name) =>
        name === "x-ge-tenant" ? "missing" : name === "host" ? "capoeiranago.cl" : null,
      )?.slug,
    ).toBe("nago");
    delete process.env.DEV_TENANT_SLUG;
    expect(
      tenantFromHeaderGet((name) => (name === "host" ? "localhost:3000" : null))?.slug,
    ).toBe("nago");
  });
});
