import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setDynamicTenantsCache, type TenantConfig } from "@/lib/tenant/tenantRegistry";

const { headerGet, ensureTenantRegistryLoaded, createServerClient } = vi.hoisted(() => ({
  headerGet: vi.fn<(name: string) => string | null>(() => null),
  ensureTenantRegistryLoaded: vi.fn(async () => {}),
  createServerClient: vi.fn(() => ({ auth: {} })),
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => headerGet(name) }),
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

vi.mock("@/lib/pulsar/pulsarTenantStore", () => ({
  ensureTenantRegistryLoaded: () => ensureTenantRegistryLoaded(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => createServerClient(...args),
}));

import { createClient } from "@/lib/supabase/server";
import { readRequestSupabaseEnvDiagnosis } from "@/lib/supabase/requestPublicEnv";

const liora = {
  slug: "liora",
  hosts: ["liorastudio.cl"],
  supabaseUrl: "https://liora.supabase.co",
  supabaseAnonKey: "anon-liora",
  supabaseServiceRoleKey: "srv-liora",
} as TenantConfig;

describe("readRequestSupabaseEnvDiagnosis", () => {
  const prev = { ...process.env };
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    headerGet.mockReset();
    headerGet.mockReturnValue(null);
    ensureTenantRegistryLoaded.mockReset();
    ensureTenantRegistryLoaded.mockResolvedValue(undefined);
    createServerClient.mockClear();
    setDynamicTenantsCache(null);
    delete process.env.TENANTS_CONFIG_JSON;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.PULSAR_HOSTS;
    process.env.PULSAR_SUPABASE_URL = "https://pulsar.test";
    process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY = "service-test";
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    setDynamicTenantsCache(null);
    process.env = { ...prev };
  });

  it("logs the host when liorastudio.cl does not resolve", async () => {
    headerGet.mockImplementation((name) => (name === "host" ? "liorastudio.cl" : null));

    const diag = await readRequestSupabaseEnvDiagnosis();

    expect(diag.reason).toBe("tenant_not_resolved");
    expect(diag.host).toBe("liorastudio.cl");
    expect(diag.url).toBe("");
    expect(errorSpy).toHaveBeenCalledWith(
      "[ge:server]",
      "supabase.request_env_missing",
      expect.objectContaining({
        reason: "tenant_not_resolved",
        host: "liorastudio.cl",
        tenantSlug: null,
        dynamicCacheLoaded: false,
      }),
    );
    await expect(createClient()).rejects.toThrow(/host=liorastudio\.cl/);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("uses the tenant loaded into this process for liorastudio.cl", async () => {
    headerGet.mockImplementation((name) => (name === "x-forwarded-host" ? "liorastudio.cl" : null));
    ensureTenantRegistryLoaded.mockImplementation(async () => {
      setDynamicTenantsCache([liora]);
    });

    const diag = await readRequestSupabaseEnvDiagnosis();

    expect(ensureTenantRegistryLoaded).toHaveBeenCalled();
    expect(diag.reason).toBe("ok");
    expect(diag.tenantSlug).toBe("liora");
    expect(diag.url).toBe("https://liora.supabase.co");
    expect(diag.dynamicCacheLoaded).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("does not log when the host is Pulsar", async () => {
    headerGet.mockImplementation((name) => (name === "host" ? "pulsarlab.cl" : null));

    const diag = await readRequestSupabaseEnvDiagnosis();

    expect(diag.reason).toBe("pulsar_host");
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
