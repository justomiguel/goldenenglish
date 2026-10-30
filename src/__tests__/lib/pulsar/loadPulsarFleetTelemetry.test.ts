import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientFromCredentialsMock } = vi.hoisted(() => ({
  createAdminClientFromCredentialsMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClientFromCredentials: (...args: unknown[]) =>
    createAdminClientFromCredentialsMock(...args),
}));

import {
  loadPulsarFleetTelemetry,
  probeSingleTenantConnection,
} from "@/lib/pulsar/loadPulsarFleetTelemetry";
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

describe("loadPulsarFleetTelemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isolates a failing tenant while returning online status and 7d/30d visits for healthy tenants", async () => {
    createAdminClientFromCredentialsMock.mockImplementation((url: string) => {
      if (url.includes("broken")) {
        return {
          from: () => ({
            select: () => Promise.resolve({ count: null, error: { code: "PGRST301", message: "JWT expired" } }),
          }),
        };
      }
      return {
        from: (table: string) => {
          if (table === "site_themes") {
            return {
              select: (_cols: string, opts?: { head?: boolean }) => {
                if (opts?.head) return Promise.resolve({ count: 1, error: null });
                return {
                  eq: () => ({
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: { properties: { "app.logo.path": "/images/nago/logo.png" } },
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
              if (opts?.head) {
                return {
                  gte: (_col: string, iso: string) => {
                    const daysDiff = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
                    return Promise.resolve({
                      count: daysDiff > 10 ? 420 : 115,
                      error: null,
                    });
                  },
                };
              }
              return {
                order: () => ({
                  limit: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: { created_at: "2026-10-25T18:00:00Z" },
                        error: null,
                      }),
                  }),
                }),
              };
            },
          };
        },
      };
    });

    const map = await loadPulsarFleetTelemetry([makeTenant("nago"), makeTenant("broken")]);

    expect(map.nago?.status).toBe("online");
    expect(map.nago?.visits7d).toBe(115);
    expect(map.nago?.visits30d).toBe(420);
    expect(map.nago?.lastHitAt).toBe("2026-10-25T18:00:00Z");
    expect(map.nago?.logoUrl).toBe("/images/nago/logo/logo.png");

    expect(map.broken?.status).toBe("error");
    expect(map.broken?.errorCode).toBe("PGRST301");
    expect(map.broken?.visits7d).toBeNull();
  });

  it("probes a single tenant connection for the test button", async () => {
    createAdminClientFromCredentialsMock.mockReturnValue({
      from: () => ({
        select: () => Promise.resolve({ count: 2, error: null }),
      }),
    });

    const res = await probeSingleTenantConnection("https://nago.supabase.co", "srv-nago");
    expect(res.ok).toBe(true);
    expect(res.errorCode).toBeNull();
  });

  it("reports a probe error and a non-Error rejection without dropping the other tenant", async () => {
    createAdminClientFromCredentialsMock.mockImplementation((url: string) => {
      if (url.includes("timeout")) {
        return {
          from: () => ({
            select: () => Promise.reject(new Error("socket")),
          }),
        };
      }
      if (url.includes("plain")) {
        return {
          from: () => ({
            select: () => Promise.reject("down"),
          }),
        };
      }
      if (url.includes("partial")) {
        return {
          from: (table: string) => {
            if (table === "site_themes") {
              return { select: () => Promise.resolve({ count: 1, error: null }) };
            }
            return {
              select: () => ({
                gte: () => Promise.resolve({ count: null, error: { message: "hits" } }),
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({ data: { created_at: 12 }, error: null }),
                  }),
                }),
              }),
            };
          },
        };
      }
      return {
        from: () => ({
          select: () => Promise.resolve({ count: 1, error: { message: "db_error" } }),
        }),
      };
    });

    const probe = await probeSingleTenantConnection("https://nago.supabase.co", "srv");
    expect(probe.ok).toBe(false);
    expect(probe.errorCode).toBe("db_error");

    createAdminClientFromCredentialsMock.mockReturnValueOnce({
      from: () => ({ select: () => Promise.reject("down") }),
    });
    const thrown = await probeSingleTenantConnection("https://nago.supabase.co", "srv");
    expect(thrown.ok).toBe(false);
    expect(thrown.errorCode).toBe("connection_failed");

    const map = await loadPulsarFleetTelemetry([
      makeTenant("timeout"),
      makeTenant("plain"),
      makeTenant("partial"),
    ]);
    expect(map.timeout?.status).toBe("error");
    expect(map.timeout?.errorCode).toBe("socket");
    expect(map.plain?.errorCode).toBe("probe_failed");
    expect(map.partial?.status).toBe("online");
    expect(map.partial?.visits7d).toBe(0);
    expect(map.partial?.visits30d).toBe(0);
    expect(map.partial?.lastHitAt).toBeNull();
  });
});
