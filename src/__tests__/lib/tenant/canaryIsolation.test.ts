/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const headerGet = vi.hoisted(() => vi.fn((_name: string): string | null => null));
const supabaseCreate = vi.hoisted(() => vi.fn(() => ({ kind: "admin" })));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => headerGet(name) }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => supabaseCreate(...args),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { jobKey } from "@/lib/import/importJobKv";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { runWithTenant } from "@/lib/tenant/tenantAls";
import { getTenantBySlug, type TenantConfig } from "@/lib/tenant/tenantRegistry";

const keyA = Buffer.alloc(32, 1).toString("base64");
const keyB = Buffer.alloc(32, 2).toString("base64");
const keyShared = Buffer.alloc(32, 9).toString("base64");

function tenant(slug: string, serviceKey: string, paymentKey: string): TenantConfig {
  return {
    slug,
    hosts: [`${slug}.example`],
    supabaseUrl: `https://${slug}.supabase.co`,
    supabaseAnonKey: `anon-${slug}`,
    supabaseServiceRoleKey: serviceKey,
    databaseUrl: null,
    brandThemeSlug: null,
    mailTenant: null,
    resendFromEmail: null,
    resendApiKey: null,
    publicUrl: `https://${slug}.example`,
    paymentGatewaySecretEncryptionKey: paymentKey,
    whatsappAccessToken: null,
    whatsappPhoneNumberId: null,
    whatsappClassReminderTemplateName: null,
    vapidPublicKey: null,
    vapidPrivateKey: null,
    vapidContactEmail: null,
    googleMapsApiKey: null,
    googleMapsMapId: null,
    kvRestApiUrl: `https://kv.${slug}.test`,
    kvRestApiToken: `tok-${slug}`,
    debugLogin: false,
    skipInitialSiteSetup: false,
  };
}

const nago = tenant("nago", "service-nago", keyA);
const golden = tenant("golden", "service-golden", keyB);

describe("canary tenant isolation", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    supabaseCreate.mockClear();
    headerGet.mockReset();
    headerGet.mockImplementation((name: string) => (name === "host" ? "unknown.example" : null));
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([nago, golden]);
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-shared";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://shared.supabase.co";
    process.env.PAYMENT_GATEWAY_SECRET_ENCRYPTION_KEY = keyShared;
    delete process.env.DEV_TENANT_SLUG;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("uses the active tenant service role key", async () => {
    const resolved = getTenantBySlug("nago");
    expect(resolved).not.toBeNull();
    await runWithTenant(resolved!, () => createAdminClient());
    expect(supabaseCreate).toHaveBeenCalledWith(
      "https://nago.supabase.co",
      "service-nago",
      expect.any(Object),
    );
  });

  it("does not use the shared service role key when the host is unknown", async () => {
    await expect(createAdminClient()).rejects.toThrow(/Missing SUPABASE_SERVICE_ROLE_KEY/);
    expect(supabaseCreate).not.toHaveBeenCalled();
  });

  it("uses the tenant payment key and ignores the shared env key", async () => {
    const resolved = getTenantBySlug("golden");
    const buf = await runWithTenant(resolved!, () => loadPaymentGatewayEncryptionKeyRaw32());
    expect(buf.equals(Buffer.from(keyB, "base64"))).toBe(true);
    expect(buf.equals(Buffer.from(keyShared, "base64"))).toBe(false);
  });

  it("scopes KV job keys by tenant slug", () => {
    expect(jobKey("job-1", "nago")).toBe("import:job:nago:job-1");
    expect(jobKey("job-1", "golden")).toBe("import:job:golden:job-1");
    expect(jobKey("job-1", "nago")).not.toBe(jobKey("job-1", "golden"));
  });
});
