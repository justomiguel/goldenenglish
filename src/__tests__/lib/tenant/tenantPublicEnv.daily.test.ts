import { describe, expect, it } from "vitest";
import { tenantPublicEnv } from "@/lib/tenant/tenantPublicEnv";
import type { TenantConfig } from "@/lib/tenant/tenantRegistry";

const tenant = {
  slug: "demo",
  hosts: ["demo.localhost"],
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon",
  supabaseServiceRoleKey: "service",
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
  commercialPlan: "ecosistema",
  dailyApiKey: "daily-secret",
  dailyDomain: "demo.daily.co",
} satisfies TenantConfig;

// REGRESSION CHECK: Daily credentials stay off TenantPublicEnv. A leak here
// would put the key and domain on window.__GE_TENANT_PUBLIC__.
describe("tenantPublicEnv daily fields", () => {
  it("keeps the Daily key and domain off the public env", () => {
    const pub = tenantPublicEnv(tenant);
    expect(JSON.stringify(pub)).not.toContain("daily-secret");
    expect(JSON.stringify(pub)).not.toContain("demo.daily.co");
    expect(pub).not.toHaveProperty("dailyApiKey");
    expect(pub).not.toHaveProperty("dailyDomain");
  });
});
