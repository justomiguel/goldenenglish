import { describe, expect, it } from "vitest";
import {
  validatePulsarPlatformHostsInput,
  validatePulsarTenantInput,
} from "@/lib/pulsar/pulsarTenantSchema";
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
      expect(res.value.hosts).toEqual([
        "liorastudio.cl",
        "www.liorastudio.cl",
        "liora.centrolisto.cl",
        "liora.pulsarlab.cl",
        "liora.pulsarlab.vercel.app",
      ]);
      expect(res.value.paymentGatewaySecretEncryptionKey).toBeNull();
      expect(res.value.kvRestApiUrl).toBeNull();
      expect(res.value.kvRestApiToken).toBeNull();
      expect(res.value.pulsarMailQuota).toBe(50);
    }
  });

  it("rejects a mail cap that is not a whole number", () => {
    const res = validatePulsarTenantInput(
      {
        slug: "liora",
        displayName: "Liora Studio",
        hosts: ["liorastudio.cl"],
        supabaseUrl: "https://liora.supabase.co",
        supabaseAnonKey: "anon-liora",
        supabaseServiceRoleKey: "srv-liora",
        pulsarMailQuota: "nope",
      },
      EXISTING,
    );
    expect(res).toEqual({ ok: false, errorCode: "invalid_mail_quota" });
  });

  it("stores null for payment and KV secrets on create even when the payload sets them", () => {
    const res = validatePulsarTenantInput(
      {
        slug: "liora",
        displayName: "Liora Studio",
        isEnabled: true,
        hosts: ["liorastudio.cl"],
        supabaseUrl: "https://liora.supabase.co",
        supabaseAnonKey: "anon-liora",
        supabaseServiceRoleKey: "srv-liora",
        paymentGatewaySecretEncryptionKey: VALID_32B_KEY,
        kvRestApiUrl: "https://kv.example.test",
        kvRestApiToken: "tok",
      },
      EXISTING,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.paymentGatewaySecretEncryptionKey).toBeNull();
      expect(res.value.kvRestApiUrl).toBeNull();
      expect(res.value.kvRestApiToken).toBeNull();
    }
  });

  it("keeps stored payment and KV secrets when an edit omits them", () => {
    const stored = {
      ...EXISTING[0],
      paymentGatewaySecretEncryptionKey: VALID_32B_KEY,
      kvRestApiUrl: "https://kv.nago.test",
      kvRestApiToken: "tok-nago",
    };
    const res = validatePulsarTenantInput(
      {
        slug: "nago",
        displayName: "Capoeira Nago Chile",
        isEnabled: true,
        hosts: ["capoeiranago.cl"],
        supabaseUrl: "https://nago.supabase.co",
        supabaseAnonKey: "anon-nago",
        supabaseServiceRoleKey: "srv-nago",
        paymentGatewaySecretEncryptionKey: "",
        kvRestApiUrl: "",
        kvRestApiToken: "",
      },
      [stored],
      "nago",
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.paymentGatewaySecretEncryptionKey).toBe(VALID_32B_KEY);
      expect(res.value.kvRestApiUrl).toBe("https://kv.nago.test");
      expect(res.value.kvRestApiToken).toBe("tok-nago");
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

    const badCentroListoHost = validatePulsarTenantInput(
      {
        slug: "instituto",
        displayName: "Instituto",
        isEnabled: true,
        hosts: ["centrolisto.cl"],
        supabaseUrl: "https://x.supabase.co",
        supabaseAnonKey: "anon",
        supabaseServiceRoleKey: "srv",
      },
      EXISTING,
    );
    expect(badCentroListoHost).toEqual({ ok: false, errorCode: "reserved_pulsar_host" });
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

  it("rejects a new payment key on edit when it does not decode to 32 bytes", () => {
    const badKey = validatePulsarTenantInput(
      {
        slug: "nago",
        displayName: "Capoeira Nago",
        isEnabled: true,
        hosts: ["capoeiranago.cl"],
        supabaseUrl: "https://nago.supabase.co",
        supabaseAnonKey: "anon-nago",
        supabaseServiceRoleKey: "srv-nago",
        paymentGatewaySecretEncryptionKey: "dG9vLXNob3J0",
      },
      EXISTING,
      "nago",
    );
    expect(badKey).toEqual({ ok: false, errorCode: "invalid_payment_key" });
  });

  it("ignores an invalid payment key on create and stores null", () => {
    const res = validatePulsarTenantInput(
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
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.paymentGatewaySecretEncryptionKey).toBeNull();
    }
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
    ).toEqual({ ok: false, errorCode: "invalid_supabase_credentials" });
    const projectPreview = validatePulsarTenantInput(
      {
        slug: "liora",
        displayName: "Liora",
        hosts: "",
        supabaseUrl: "https://x.supabase.co",
        supabaseAnonKey: "anon",
        supabaseServiceRoleKey: "srv",
      },
      EXISTING,
    );
    expect(projectPreview.ok).toBe(true);
    if (projectPreview.ok) {
      expect(projectPreview.value.hosts).toContain("liora.centrolisto.cl");
    }
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

    const shared = validatePulsarTenantInput(
      { slug: "acme-norte", displayName: "Acme Norte", hosts: "", dataMode: "shared_schema" },
      EXISTING,
      undefined,
      {
        url: "https://pulsar.supabase.co",
        anonKey: "anon-pulsar",
        serviceRoleKey: "srv-pulsar",
        databaseUrl: "postgresql://postgres:secret@db.example:5432/postgres",
      },
    );
    expect(shared.ok).toBe(true);
    if (shared.ok) {
      expect(shared.value.dataMode).toBe("shared_schema");
      expect(shared.value.postgresSchema).toBe("tenant_acme_norte");
      expect(shared.value.supabaseUrl).toBe("https://pulsar.supabase.co");
      expect(shared.value.hosts).toContain("acme-norte.centrolisto.cl");
    }
    expect(
      validatePulsarTenantInput(
        { slug: "acme", displayName: "Acme", dataMode: "shared_schema" },
        EXISTING,
      ),
    ).toEqual({ ok: false, errorCode: "pulsar_shared_db_unconfigured" });
  });
});

// REGRESSION CHECK: Validating platform_settings.pulsar_hosts must reject empty host lists
// and any hostname already assigned to an institute in platform_tenants.
describe("validatePulsarPlatformHostsInput", () => {
  it("normalizes comma/newline separated hosts and deduplicates", () => {
    const res = validatePulsarPlatformHostsInput(
      "  PulsarLab.cl:443 , www.pulsarlab.cl\npulsar.nuevo.cl , pulsarlab.cl ",
      EXISTING,
    );
    expect(res).toEqual({
      ok: true,
      hosts: ["pulsarlab.cl", "www.pulsarlab.cl", "pulsar.nuevo.cl"],
    });
  });

  it("rejects empty input or collisions with existing tenant hosts", () => {
    expect(validatePulsarPlatformHostsInput(" , \n ", EXISTING)).toEqual({
      ok: false,
      errorCode: "missing_hosts",
    });
    expect(
      validatePulsarPlatformHostsInput(["pulsarlab.cl", "capoeiranago.cl"], EXISTING),
    ).toEqual({
      ok: false,
      errorCode: "duplicate_host",
    });
  });
});
