import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { createRegistration } from "@/app/[locale]/dashboard/admin/registrations/registrationDraftAction";

const E = es.actionErrors.registrationDraft;
const REG_ID = "123e4567-e89b-12d3-a456-426614174000";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (...args: unknown[]) => mockFrom(...args) }),
}));

const valid = {
  first_name: "Ana",
  last_name: "Rojas",
  dni: "123",
  email: "Ana@Example.com",
  phone: "",
  birth_date: "",
  level_interest: "",
  tutor_name: "",
  tutor_dni: "",
  tutor_email: "",
  tutor_phone: "",
  tutor_relationship: "",
};

function mockInsert(result: { data: { id: string } | null; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  mockFrom.mockReturnValue({ insert });
  return insert;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertAdmin.mockResolvedValue({ user: { id: "11111111-1111-4111-8111-111111111111" } });
});

describe("createRegistration", () => {
  it("returns forbidden when the caller is not an admin", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const insert = mockInsert({ data: { id: REG_ID }, error: null });

    const result = await createRegistration("es", valid);

    expect(result).toEqual({ ok: false, message: E.forbidden });
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects an empty name before insert", async () => {
    const result = await createRegistration("es", { ...valid, first_name: "  " });

    expect(result).toEqual({ ok: false, message: E.invalidData });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("inserts a pending request and stores the email in lower case", async () => {
    const insert = mockInsert({ data: { id: REG_ID }, error: null });

    const result = await createRegistration("es", valid);

    expect(result).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Ana",
        last_name: "Rojas",
        email: "ana@example.com",
        status: "new",
      }),
    );
  });
});
