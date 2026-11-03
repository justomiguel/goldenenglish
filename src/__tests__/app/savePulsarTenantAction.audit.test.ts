import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionMock, insertMock, upsertMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  insertMock: vi.fn(),
  upsertMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/pulsar/pulsarStaffAuth", () => ({
  getPulsarStaffSession: () => sessionMock(),
}));
vi.mock("@/lib/supabase/pulsar", () => ({
  createPulsarAdminClient: () => ({
    from: (table: string) =>
      table === "platform_audit_log"
        ? { insert: insertMock }
        : { upsert: upsertMock },
  }),
  isPulsarSupabaseConfigured: () => true,
  readSharedPulsarCredentials: () => null,
}));
vi.mock("@/lib/pulsar/pulsarTenantStore", () => ({
  loadAllPulsarTenantsForAdmin: async () => [],
  invalidateTenantRegistryCache: vi.fn(),
}));
vi.mock("@/lib/pulsar/provisionSharedInstituteSchema", () => ({
  prepareInstituteDataPlane: async () => ({ ok: true, pulsarDatabaseUrl: null }),
}));
vi.mock("@/lib/pulsar/finishStaffTenantSave", () => ({
  finishStaffTenantSave: async (record: { slug: string }) => ({ ok: true, slug: record.slug }),
}));

import { savePulsarTenantAction } from "@/app/[locale]/admin/actions";

// REGRESSION CHECK: Audit rows list changed field names. They must not store
// Daily API key values from the save payload.
describe("savePulsarTenantAction audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue({
      userId: "u-1",
      email: "staff@pulsarlab.cl",
      mode: "pulsar-db",
      mustChangePassword: false,
    });
    upsertMock.mockResolvedValue({ error: null });
    insertMock.mockResolvedValue({ error: null });
  });

  it("records dailyApiKey in changed_fields without the secret value", async () => {
    const result = await savePulsarTenantAction({
      locale: "es",
      payload: {
        slug: "demo",
        displayName: "Demo",
        hosts: ["demo.cl"],
        supabaseUrl: "https://demo.supabase.co",
        supabaseAnonKey: "anon",
        supabaseServiceRoleKey: "srv",
        dailyApiKey: "daily-secret",
      },
    });

    expect(result).toEqual({ ok: true, slug: "demo" });
    expect(insertMock).toHaveBeenCalledOnce();
    const insertArg = insertMock.mock.calls[0]?.[0];
    expect(insertArg.changed_fields).toContain("dailyApiKey");
    expect(JSON.stringify(insertArg)).not.toContain("daily-secret");
  });
});
