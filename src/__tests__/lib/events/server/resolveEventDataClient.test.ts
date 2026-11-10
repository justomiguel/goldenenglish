import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerError: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));
vi.mock("@/lib/supabase/pulsar", () => ({ createPulsarAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
  createAdminClientFromCredentials: vi.fn(),
}));
vi.mock("@/lib/supabase/bindInstituteDataPlane", () => ({
  bindInstituteDataPlane: vi.fn((client: unknown) => client),
}));
vi.mock("@/lib/tenant/tenantRegistry", () => ({ getTenantBySlug: vi.fn() }));
vi.mock("@/lib/tenant/tenantRequestContext", () => ({ resolveRequestTenant: vi.fn() }));

import { resolveEventDataClientWith } from "@/lib/events/server/resolveEventDataClient";

// REGRESSION CHECK: A local event id never opens the owner client.
// A guest id opens the owner client only when the grant is approved.

function currentClient(found: boolean) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data: found ? { id: "evt-1" } : null, error: null }),
              };
            },
          };
        },
      };
    },
  };
}

describe("resolveEventDataClientWith", () => {
  it("uses the current client when the event lives here", async () => {
    const client = currentClient(true);
    const ownerClient = vi.fn();
    const result = await resolveEventDataClientWith({
      eventId: "evt-1",
      currentSlug: "matiss",
      currentClient: client as never,
      approvedGrants: [{ ownerSlug: "liora", ownerEventId: "evt-1" }],
      ownerClient,
    });
    expect(result).toEqual({ ok: true, client, ownerSlug: "matiss", access: "local" });
    expect(ownerClient).not.toHaveBeenCalled();
  });

  it("uses the owner client for an approved guest grant", async () => {
    const owner = { tag: "liora" };
    const result = await resolveEventDataClientWith({
      eventId: "evt-1",
      currentSlug: "matiss",
      currentClient: currentClient(false) as never,
      approvedGrants: [{ ownerSlug: "liora", ownerEventId: "evt-1" }],
      ownerClient: () => owner as never,
    });
    expect(result).toEqual({ ok: true, client: owner, ownerSlug: "liora", access: "guest" });
  });

  it("refuses an event with no local row and no grant", async () => {
    const result = await resolveEventDataClientWith({
      eventId: "evt-9",
      currentSlug: "matiss",
      currentClient: currentClient(false) as never,
      approvedGrants: [],
      ownerClient: () => ({}) as never,
    });
    expect(result).toEqual({ ok: false, code: "share_not_approved" });
  });
});
