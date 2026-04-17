import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitPublicRegistration } from "@/app/[locale]/register/actions";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import esDict from "@/dictionaries/es.json";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockGetInscriptionsEnabled = vi.fn();
vi.mock("@/lib/settings/inscriptionsServer", () => ({
  getInscriptionsEnabled: () => mockGetInscriptionsEnabled(),
}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const SECTION_ID = "00000000-0000-4000-8000-000000000001";

const valid = {
  first_name: "Ada",
  last_name: "Lovelace",
  dni: "123",
  email: "ada@test.com",
  phone: "+100",
  birth_date: "2000-05-01",
  preferred_section_id: SECTION_ID,
};

function mockClientWithRpcAndInsert(insertResult: { error: unknown }) {
  return {
    rpc: vi.fn().mockResolvedValue({
      data: "Cohort — Section A",
      error: null,
    }),
    from: () => ({
      insert: vi.fn().mockResolvedValue(insertResult),
    }),
  };
}

describe("submitPublicRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns closed when inscriptions disabled", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(false);
    const r = await submitPublicRegistration("es", valid);
    expect(r).toEqual({ ok: false, message: esDict.register.closed });
  });

  it("returns validation when body invalid", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    const r = await submitPublicRegistration("es", {
      ...valid,
      email: "bad",
      phone: "+1",
      preferred_section_id: SECTION_ID,
    });
    expect(r).toEqual({ ok: false, message: esDict.register.validationError });
  });

  it("returns invalid section when section rpc fails or returns empty", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    mockCreateClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      from: vi.fn(),
    });
    const r = await submitPublicRegistration("es", valid);
    expect(r).toEqual({
      ok: false,
      message: esDict.register.invalidSectionOption,
    });
  });

  it("returns db message on insert error", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    mockCreateClient.mockResolvedValue(
      mockClientWithRpcAndInsert({
        error: { message: "duplicate" },
      }),
    );
    const r = await submitPublicRegistration("es", valid);
    expect(r).toEqual({
      ok: false,
      message: esDict.actionErrors.register.insertFailed,
    });
  });

  it("returns ok on success", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    mockCreateClient.mockResolvedValue(
      mockClientWithRpcAndInsert({ error: null }),
    );
    const r = await submitPublicRegistration("en", valid);
    expect(r).toEqual({ ok: true });
  });

  it("does not call section RPC when applicant chose undecided", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    const rpc = vi.fn();
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({ rpc, from: () => ({ insert }) });
    const r = await submitPublicRegistration("es", {
      ...valid,
      preferred_section_id: REGISTRATION_UNDECIDED_FORM_VALUE,
    });
    expect(r).toEqual({ ok: true });
    expect(rpc).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalled();
  });
});
