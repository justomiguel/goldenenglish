import { describe, expect, it } from "vitest";
import { validatePulsarTenantInput } from "@/lib/pulsar/pulsarTenantSchema";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";

const EXISTING: PulsarTenantRecord[] = [
  {
    slug: "nago",
    displayName: "Capoeira Nago",
    isEnabled: true,
    updatedAt: null,
    hosts: ["capoeiranago.cl", "www.capoeiranago.cl"],
    supabaseUrl: "https://nago.supabase.co",
    supabaseAnonKey: "anon-nago",
    supabaseServiceRoleKey: "srv-nago",
    databaseUrl: null,
    brandThemeSlug: "nago",
    mailTenant: "capoeiranago.cl",
    resendFromEmail: null,
    resendApiKey: null,
    publicUrl: "https://www.capoeiranago.cl",
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
  },
];

const VALID_32B_KEY = Buffer.alloc(32, 7).toString("base64");

describe("validatePulsarTenantInput", () => {
  it("normalizes hosts and accepts valid tenant input", () => {
    const res = validatePulsarTenantInput(
      {
        slug: "liora",
        displayName: "Liora Studio",
        isEnabled: true,
        hosts: ["  LioraStudio.cl:443 ", "www.liorastudio.cl"],
        supabaseUrl: "https://liora.supabase.co",
        supabaseAnonKey: "anon-liora",
        supabaseServiceRoleKey: "srv-liora",
        paymentGatewaySecretEncryptionKey: VALID_32B_KEY,
      },
      EXISTING,
    );

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.hosts).toEqual(["liorastudio.cl", "www.liorastudio.cl"]);
      expect(res.value.paymentGatewaySecretEncryptionKey).toBe(VALID_32B_KEY);
    }
  });

  it("rejects reserved pulsar slug and pulsarlab.cl hosts", () => {
    const badSlug = validatePulsarTenantInput(
      {
        slug: "pulsar",
        displayName: "Pulsar",
        isEnabled: true,
        hosts: ["otro.cl"],
        supabaseUrl: "https://x.supabase.co",
        supabaseAnonKey: "anon",
        supabaseServiceRoleKey: "srv",
      },
      EXISTING,
    );
    expect(badSlug).toEqual({ ok: false, errorCode: "invalid_slug" });

    const badHost = validatePulsarTenantInput(
      {
        slug: "instituto",
        displayName: "Instituto",
        isEnabled: true,
        hosts: ["pulsarlab.cl"],
        supabaseUrl: "https://x.supabase.co",
        supabaseAnonKey: "anon",
        supabaseServiceRoleKey: "srv",
      },
      EXISTING,
    );
    expect(badHost).toEqual({ ok: false, errorCode: "reserved_pulsar_host" });
  });

  it("rejects host collisions with another tenant but allows own hosts when editing", () => {
    const collision = validatePulsarTenantInput(
      {
        slug: "otro",
        displayName: "Otro",
        isEnabled: true,
        hosts: ["capoeiranago.cl"],
        supabaseUrl: "https://x.supabase.co",
        supabaseAnonKey: "anon",
        supabaseServiceRoleKey: "srv",
      },
      EXISTING,
    );
    expect(collision).toEqual({ ok: false, errorCode: "duplicate_host" });

    const ownEdit = validatePulsarTenantInput(
      {
        slug: "nago",
        displayName: "Capoeira Nago Chile",
        isEnabled: true,
        hosts: ["capoeiranago.cl", "www.capoeiranago.cl"],
        supabaseUrl: "https://nago.supabase.co",
        supabaseAnonKey: "anon-nago",
        supabaseServiceRoleKey: "srv-nago",
      },
      EXISTING,
      "nago",
    );
    expect(ownEdit.ok).toBe(true);
  });

  it("rejects payment encryption keys that do not decode to 32 bytes", () => {
    const badKey = validatePulsarTenantInput(
      {
        slug: "liora",
        displayName: "Liora",
        isEnabled: true,
        hosts: ["liora.cl"],
        supabaseUrl: "https://liora.supabase.co",
        supabaseAnonKey: "anon",
        supabaseServiceRoleKey: "srv",
        paymentGatewaySecretEncryptionKey: "dG9vLXNob3J0",
      },
      EXISTING,
    );
    expect(badKey).toEqual({ ok: false, errorCode: "invalid_payment_key" });
  });

  it("rejects empty input, duplicate slugs, and bad URLs", () => {
    expect(validatePulsarTenantInput(null, EXISTING)).toEqual({
      ok: false,
      errorCode: "invalid_input",
    });
    expect(validatePulsarTenantInput({ slug: "   " }, EXISTING).ok).toBe(false);
    expect(
      validatePulsarTenantInput(
        {
          slug: "nago",
          displayName: "Nago",
          hosts: "capoeiranago.cl",
          supabaseUrl: "https://nago.supabase.co",
          supabaseAnonKey: "anon",
          supabaseServiceRoleKey: "srv",
        },
        EXISTING,
      ),
    ).toEqual({ ok: false, errorCode: "duplicate_slug" });
    expect(
      validatePulsarTenantInput(
        { slug: "liora", hosts: ["liora.cl"], supabaseUrl: "https://x.supabase.co" },
        EXISTING,
      ),
    ).toEqual({ ok: false, errorCode: "missing_display_name" });
    expect(
      validatePulsarTenantInput(
        { slug: "liora", displayName: "Liora", hosts: " , ", supabaseUrl: "https://x.supabase.co" },
        EXISTING,
      ),
    ).toEqual({ ok: false, errorCode: "missing_hosts" });
    expect(
      validatePulsarTenantInput(
        {
          slug: "liora",
          displayName: "Liora",
          hosts: "liora.cl",
          supabaseUrl: "ftp://files.example",
          supabaseAnonKey: "anon",
          supabaseServiceRoleKey: "srv",
        },
        EXISTING,
      ),
    ).toEqual({ ok: false, errorCode: "invalid_supabase_credentials" });
    expect(
      validatePulsarTenantInput(
        {
          slug: "liora",
          displayName: "Liora",
          hosts: "liora.cl",
          supabaseUrl: "https://x.supabase.co",
          supabaseAnonKey: "anon",
          supabaseServiceRoleKey: "srv",
          publicUrl: "not a url",
        },
        EXISTING,
      ),
    ).toEqual({ ok: false, errorCode: "invalid_public_url" });
  });
});
