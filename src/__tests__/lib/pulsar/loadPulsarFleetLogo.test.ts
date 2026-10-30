import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientFromCredentialsMock } = vi.hoisted(() => ({
  createAdminClientFromCredentialsMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClientFromCredentials: (...args: unknown[]) =>
    createAdminClientFromCredentialsMock(...args),
}));

import { loadPulsarFleetTelemetry } from "@/lib/pulsar/loadPulsarFleetTelemetry";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";

function makeTenant(slug: string): PulsarTenantRecord {
  return {
    slug,
    displayName: slug.toUpperCase(),
    isEnabled: true,
    updatedAt: null,
    hosts: [`${slug}.cl`],
    supabaseUrl: `https://${slug}.supabase.co`,
    supabaseAnonKey: `anon-${slug}`,
    supabaseServiceRoleKey: `srv-${slug}`,
    databaseUrl: null,
    brandThemeSlug: slug,
    mailTenant: `${slug}.cl`,
    resendFromEmail: null,
    resendApiKey: null,
    publicUrl: `https://${slug}.cl`,
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
}

describe("loadPulsarFleetTelemetry logos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the brand theme logo when another theme is the active row", async () => {
    createAdminClientFromCredentialsMock.mockImplementation(() => ({
      from: (table: string) => {
        if (table === "site_themes") {
          return {
            select: (_cols: string, opts?: { head?: boolean }) => {
              if (opts?.head) return Promise.resolve({ count: 1, error: null });
              return {
                eq: (column: string, value: unknown) => ({
                  limit: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: {
                          properties: {
                            "app.logo.path":
                              column === "slug" && value === "liora"
                                ? "wizard/liora.png"
                                : "/images/mimundo/logo/logo.png",
                          },
                        },
                        error: null,
                      }),
                  }),
                }),
              };
            },
          };
        }
        return {
          select: (_cols: string, opts?: { head?: boolean }) => {
            if (opts?.head) return { gte: () => Promise.resolve({ count: 0, error: null }) };
            return {
              order: () => ({
                limit: () => ({
                  maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
              }),
            };
          },
        };
      },
    }));

    const map = await loadPulsarFleetTelemetry([makeTenant("liora")]);
    expect(map.liora?.logoUrl).toBe(
      "https://liora.supabase.co/storage/v1/object/public/landing-media/wizard/liora.png",
    );
  });

  it("reads the active theme when the institute has no brand slug", async () => {
    createAdminClientFromCredentialsMock.mockImplementation(() => ({
      from: (table: string) => {
        if (table !== "site_themes") {
          return {
            select: (_cols: string, opts?: { head?: boolean }) => {
              if (opts?.head) return { gte: () => Promise.resolve({ count: null, error: { message: "hits" } }) };
              return {
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({ data: { created_at: 12 }, error: null }),
                  }),
                }),
              };
            },
          };
        }
        return {
          select: (_cols: string, opts?: { head?: boolean }) => {
            if (opts?.head) return Promise.resolve({ count: 1, error: null });
            return {
              eq: (column: string) => ({
                limit: () => ({
                  maybeSingle: () =>
                    Promise.resolve(
                      column === "is_active"
                        ? { data: { properties: { "app.logo.path": 4 } }, error: null }
                        : { data: null, error: { message: "wrong" } },
                    ),
                }),
              }),
            };
          },
        };
      },
    }));

    const tenant = { ...makeTenant("golden"), brandThemeSlug: null, publicUrl: null, hosts: [] as string[] };
    const map = await loadPulsarFleetTelemetry([tenant]);
    expect(map.golden?.status).toBe("online");
    expect(map.golden?.visits7d).toBe(0);
    expect(map.golden?.visits30d).toBe(0);
    expect(map.golden?.lastHitAt).toBeNull();
    expect(map.golden?.logoUrl).toBe("/images/golden/logo/1.png");
  });
});
