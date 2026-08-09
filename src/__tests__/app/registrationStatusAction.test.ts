import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import {
  markRegistrationContacted,
  revertRegistrationToNew,
} from "@/app/[locale]/dashboard/admin/registrations/registrationStatusAction";

const E = es.actionErrors.registrationDraft;
const R = es.admin.registrations;

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockAudit = vi.fn();
vi.mock("@/lib/audit", () => ({
  auditIdentityAction: (...args: unknown[]) => mockAudit(...args),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (...args: unknown[]) => mockFrom(...args) }),
}));

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";
const ACTOR_ID = "11111111-1111-1111-1111-111111111111";

/** Chainable stub for `.update(patch).eq("id", ...).in("status", [...])`. */
function mockRegistrationsTable(currentStatus: string | null, updateError: unknown = null) {
  const inFilter = vi.fn().mockResolvedValue({ error: updateError });
  const eq = vi.fn().mockReturnValue({ in: inFilter });
  const update = vi.fn().mockReturnValue({ eq });
  return {
    table: {
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: currentStatus === null ? null : { id: REG_ID, status: currentStatus },
              error: null,
            }),
        }),
      }),
      update,
    },
    update,
    inFilter,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertAdmin.mockResolvedValue({ user: { id: ACTOR_ID } });
});

describe("markRegistrationContacted", () => {
  it("returns forbidden when the caller is not an admin", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const { update } = mockRegistrationsTable("new");
    mockFrom.mockReturnValue(mockRegistrationsTable("new").table);

    const r = await markRegistrationContacted("es", REG_ID);

    expect(r).toEqual({ ok: false, message: E.forbidden });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a malformed id before touching the database", async () => {
    const r = await markRegistrationContacted("es", "not-a-uuid");

    expect(r.ok).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns not found when the lead is gone", async () => {
    mockFrom.mockReturnValue(mockRegistrationsTable(null).table);

    const r = await markRegistrationContacted("es", REG_ID);

    expect(r).toEqual({ ok: false, message: E.notFound });
  });

  it("refuses to touch a lead that was already enrolled", async () => {
    const m = mockRegistrationsTable("enrolled");
    mockFrom.mockReturnValue(m.table);

    const r = await markRegistrationContacted("es", REG_ID);

    expect(r).toEqual({ ok: false, message: R.alreadyProcessed });
    expect(m.update).not.toHaveBeenCalled();
  });

  it("stamps the status, the timestamp and the author, and audits it", async () => {
    const m = mockRegistrationsTable("new");
    mockFrom.mockReturnValue(m.table);

    const r = await markRegistrationContacted("es", REG_ID);

    expect(r.ok).toBe(true);
    const patch = m.update.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(patch.status).toBe("contacted");
    expect(patch.contacted_by).toBe(ACTOR_ID);
    expect(typeof patch.contacted_at).toBe("string");
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: ACTOR_ID, resourceId: REG_ID }),
    );
  });

  it("only updates rows that are still pending, so a concurrent accept wins", async () => {
    const m = mockRegistrationsTable("new");
    mockFrom.mockReturnValue(m.table);

    await markRegistrationContacted("es", REG_ID);

    expect(m.inFilter).toHaveBeenCalledWith("status", ["new", "contacted"]);
  });

  it("reports a save failure instead of pretending it worked", async () => {
    const m = mockRegistrationsTable("new", { message: "db down" });
    mockFrom.mockReturnValue(m.table);

    const r = await markRegistrationContacted("es", REG_ID);

    expect(r).toEqual({ ok: false, message: E.saveFailed });
  });
});

describe("revertRegistrationToNew", () => {
  it("clears the follow-up stamps", async () => {
    const m = mockRegistrationsTable("contacted");
    mockFrom.mockReturnValue(m.table);

    const r = await revertRegistrationToNew("es", REG_ID);

    expect(r.ok).toBe(true);
    expect(m.update).toHaveBeenCalledWith({
      status: "new",
      contacted_at: null,
      contacted_by: null,
    });
  });
});
