/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runWithTenant } from "@/lib/tenant/tenantAls";
import type { TenantConfig } from "@/lib/tenant/tenantRegistry";

const getMock = vi.fn();
const setMock = vi.fn();
const createClientMock = vi.fn(() => ({
  get: (...a: unknown[]) => getMock(...a),
  set: (...a: unknown[]) => setMock(...a),
}));

vi.mock("@vercel/kv", () => ({
  kv: {
    get: (...a: unknown[]) => getMock(...a),
    set: (...a: unknown[]) => setMock(...a),
  },
  createClient: (...a: unknown[]) => createClientMock(...a),
}));

import {
  isKvImportConfigured,
  jobKey,
  mergeImportJob,
  readImportJob,
} from "@/lib/import/importJobKv";

const nagoTenant: TenantConfig = {
  slug: "nago",
  hosts: ["capoeiranago.cl"],
  supabaseUrl: "https://nago.supabase.co",
  supabaseAnonKey: "anon",
  supabaseServiceRoleKey: "srv",
  databaseUrl: null,
  brandThemeSlug: "nago",
  mailTenant: "capoeiranago.cl",
  resendFromEmail: "info@capoeiranago.cl",
  resendApiKey: "re_nago",
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
  kvRestApiUrl: "https://kv.nago.test",
  kvRestApiToken: "tok_nago",
  debugLogin: false,
  skipInitialSiteSetup: false,
};

describe("importJobKv", () => {
  const prevUrl = process.env.KV_REST_API_URL;
  const prevTok = process.env.KV_REST_API_TOKEN;
  const prevTenants = process.env.TENANTS_CONFIG_JSON;

  beforeEach(() => {
    getMock.mockReset();
    setMock.mockReset();
    createClientMock.mockClear();
    process.env.KV_REST_API_URL = "https://kv.shared.test";
    process.env.KV_REST_API_TOKEN = "tok_shared";
  });

  afterEach(() => {
    if (prevUrl === undefined) delete process.env.KV_REST_API_URL;
    else process.env.KV_REST_API_URL = prevUrl;
    if (prevTok === undefined) delete process.env.KV_REST_API_TOKEN;
    else process.env.KV_REST_API_TOKEN = prevTok;
    if (prevTenants === undefined) delete process.env.TENANTS_CONFIG_JSON;
    else process.env.TENANTS_CONFIG_JSON = prevTenants;
  });

  it("prefixes job keys with the active tenant slug", async () => {
    expect(jobKey("job-1")).toBe("import:job:job-1");
    expect(jobKey("job-1", "nago")).toBe("import:job:nago:job-1");
    expect(runWithTenant(nagoTenant, () => jobKey("job-1"))).toBe("import:job:nago:job-1");
  });

  it("uses tenant KV credentials inside runWithTenant", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    expect(isKvImportConfigured()).toBe(false);
    expect(isKvImportConfigured(nagoTenant)).toBe(true);

    getMock.mockResolvedValue(null);
    await runWithTenant(nagoTenant, async () => {
      await mergeImportJob("job-2", {
        ownerId: "user-1",
        status: "queued",
        phase: "queued",
        message: "",
        current: 0,
        total: 3,
      });
      await readImportJob("job-2");
    });

    expect(createClientMock).toHaveBeenCalledWith({
      url: "https://kv.nago.test",
      token: "tok_nago",
    });
    expect(setMock).toHaveBeenCalledWith(
      "import:job:nago:job-2",
      expect.objectContaining({ ownerId: "user-1", total: 3 }),
      { ex: 3600 },
    );
    expect(getMock).toHaveBeenCalledWith("import:job:nago:job-2");
  });

  it("ignores shared KV env while multi-tenant mode is on and no tenant is active", () => {
    process.env.TENANTS_CONFIG_JSON = "[]";
    process.env.KV_REST_API_URL = "https://kv.shared.test";
    process.env.KV_REST_API_TOKEN = "tok_shared";
    expect(isKvImportConfigured()).toBe(false);
  });
});
