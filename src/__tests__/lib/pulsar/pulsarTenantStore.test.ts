import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, isConfiguredMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  isConfiguredMock: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/pulsar", () => ({
  isPulsarSupabaseConfigured: () => isConfiguredMock(),
  createPulsarAdminClient: () => ({
    from: fromMock,
  }),
}));

import { mapTenantConfigToPulsarRecord } from "@/lib/pulsar/pulsarTenantMapper";
import {
  applyLocalMemoryPulsarHosts,
  applyLocalMemoryTenantUpsert,
  ensureTenantRegistryLoaded,
  invalidateTenantRegistryCache,
  loadAllPulsarTenantsForAdmin,
  loadPulsarPlatformHostsForAdmin,
} from "@/lib/pulsar/pulsarTenantStore";
import {
  getPulsarHosts,
  listTenants,
  setDynamicPulsarHostsCache,
  setDynamicTenantsCache,
} from "@/lib/tenant/tenantRegistry";

const DB_ROW = {
  slug: "nago",
  display_name: "Capoeira Nago",
  is_enabled: true,
  hosts: ["capoeiranago.cl"],
  supabase_url: "https://nago.supabase.co",
  supabase_anon_key: "anon-nago",
  supabase_service_role_key: "srv-nago",
  database_url: null,
  brand_theme_slug: "nago",
  mail_tenant: "capoeiranago.cl",
  resend_from_email: null,
  resend_api_key: null,
  public_url: "https://capoeiranago.cl",
  payment_gateway_secret_encryption_key: null,
  whatsapp_access_token: null,
  whatsapp_phone_number_id: null,
  whatsapp_class_reminder_template_name: null,
  vapid_public_key: null,
  vapid_private_key: null,
  vapid_contact_email: null,
  google_maps_api_key: null,
  google_maps_map_id: null,
  kv_rest_api_url: null,
  kv_rest_api_token: null,
  debug_login: false,
  skip_initial_site_setup: false,
  updated_at: "2026-10-25T12:00:00Z",
};

// REGRESSION CHECK: pulsarTenantStore loads both platform_tenants and platform_settings.pulsar_hosts
// and falls back safely when platform_settings is unavailable.
describe("pulsarTenantStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateTenantRegistryCache();
    setDynamicTenantsCache(null);
    setDynamicPulsarHostsCache(null);
    isConfiguredMock.mockReturnValue(true);
  });

  afterEach(() => {
    invalidateTenantRegistryCache();
    setDynamicTenantsCache(null);
    setDynamicPulsarHostsCache(null);
  });

  it("loads enabled tenants from platform_tenants and caches for subsequent calls", async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [DB_ROW, { ...DB_ROW, slug: "paused", hosts: ["paused.cl"], is_enabled: false }],
      error: null,
    });
    fromMock.mockReturnValue({
      select: () => ({ order: orderMock }),
    });

    await ensureTenantRegistryLoaded();
    await ensureTenantRegistryLoaded();

    expect(orderMock).toHaveBeenCalledTimes(1);
    expect(listTenants().map((t) => t.slug)).toEqual(["nago"]);

    invalidateTenantRegistryCache();
    await ensureTenantRegistryLoaded();
    expect(orderMock).toHaveBeenCalledTimes(2);
  });

  it("returns all rows (including disabled) in loadAllPulsarTenantsForAdmin", async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [DB_ROW, { ...DB_ROW, slug: "paused", hosts: ["paused.cl"], is_enabled: false }],
      error: null,
    });
    fromMock.mockReturnValue({
      select: () => ({ order: orderMock }),
    });

    const all = await loadAllPulsarTenantsForAdmin();
    expect(all.map((t) => ({ slug: t.slug, isEnabled: t.isEnabled }))).toEqual([
      { slug: "nago", isEnabled: true },
      { slug: "paused", isEnabled: false },
    ]);
  });

  it("skips unreadable rows and falls back to the last cache when the query fails", async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [{ slug: "bad" }, DB_ROW],
      error: null,
    });
    fromMock.mockReturnValue({ select: () => ({ order: orderMock }) });
    const first = await loadAllPulsarTenantsForAdmin();
    expect(first.map((t) => t.slug)).toEqual(["nago"]);

    orderMock.mockResolvedValue({ data: null, error: { message: "down" } });
    const cached = await loadAllPulsarTenantsForAdmin();
    expect(cached.map((t) => t.slug)).toEqual(["nago"]);

    fromMock.mockImplementation(() => {
      throw new Error("client");
    });
    invalidateTenantRegistryCache();
    setDynamicTenantsCache(null);
    const fallback = await loadAllPulsarTenantsForAdmin();
    expect(fallback.map((t) => t.slug)).toEqual(listTenants().map((t) => t.slug));
  });

  it("keeps a local upsert when Pulsar returns no rows", async () => {
    const saved = applyLocalMemoryTenantUpsert(mapTenantConfigToPulsarRecord({
      slug: "local",
      hosts: ["local.test"],
      supabaseUrl: "https://local.supabase.co",
      supabaseAnonKey: "anon",
      supabaseServiceRoleKey: "srv",
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
    }));
    fromMock.mockReturnValue({
      select: () => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
    });
    const all = await loadAllPulsarTenantsForAdmin();
    expect(all.some((t) => t.slug === saved.slug)).toBe(true);
  });

  it("loads pulsar_hosts from platform_settings and supports local memory override", async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [DB_ROW],
      error: null,
    });
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { pulsar_hosts: ["pulsarlab.cl", "nuevo.pulsarlab.cl"] },
      error: null,
    });
    fromMock.mockImplementation((table: string) => {
      if (table === "platform_settings") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: maybeSingleMock }),
          }),
        };
      }
      return {
        select: () => ({ order: orderMock }),
      };
    });

    await ensureTenantRegistryLoaded();
    expect(getPulsarHosts()).toEqual(["pulsarlab.cl", "nuevo.pulsarlab.cl"]);

    const loaded = await loadPulsarPlatformHostsForAdmin();
    expect(loaded).toEqual(["pulsarlab.cl", "nuevo.pulsarlab.cl"]);

    const localHosts = applyLocalMemoryPulsarHosts(["  local.pulsar.cl:443 "]);
    expect(localHosts).toEqual(["local.pulsar.cl"]);
    expect(getPulsarHosts()).toEqual(["local.pulsar.cl"]);
  });
});
