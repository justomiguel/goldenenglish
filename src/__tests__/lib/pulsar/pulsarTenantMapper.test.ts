/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  mapDbRowToPulsarTenantRecord,
  mapTenantConfigToPulsarRecord,
} from "@/lib/pulsar/pulsarTenantMapper";
import type { TenantConfig } from "@/lib/tenant/tenantRegistry";

const base: TenantConfig = {
  slug: "nago",
  hosts: ["capoeiranago.cl"],
  supabaseUrl: "https://nago.supabase.co",
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
};

describe("pulsarTenantMapper", () => {
  it("drops a row that has no hosts and fills a missing display name", () => {
    expect(mapDbRowToPulsarTenantRecord({ slug: "nago", hosts: ["  "] })).toBeNull();
    const row = mapDbRowToPulsarTenantRecord({
      slug: " Nago ",
      hosts: ["CapoeiraNago.cl"],
      supabase_url: "https://nago.supabase.co",
      supabase_anon_key: "anon",
      supabase_service_role_key: "srv",
      display_name: "  ",
      is_enabled: false,
    });
    expect(row?.slug).toBe("nago");
    expect(row?.displayName).toBe("NAGO");
    expect(row?.isEnabled).toBe(false);
    expect(row?.hosts).toEqual(["capoeiranago.cl"]);
  });

  it("labels a JSON tenant with its host", () => {
    expect(mapTenantConfigToPulsarRecord(base).displayName).toBe("NAGO (capoeiranago.cl)");
    expect(mapTenantConfigToPulsarRecord({ ...base, hosts: [] }).displayName).toBe("NAGO (nago)");
  });
});
