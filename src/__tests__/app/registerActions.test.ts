import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitPublicRegistration } from "@/app/[locale]/register/actions";

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

const valid = {
  first_name: "Ada",
  last_name: "Lovelace",
  dni: "123",
  email: "ada@test.com",
  phone: "",
  level_interest: "",
};

describe("submitPublicRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns closed when inscriptions disabled", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(false);
    const r = await submitPublicRegistration("es", valid);
    expect(r).toEqual({ ok: false, message: "closed" });
  });

  it("returns validation when body invalid", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    const r = await submitPublicRegistration("es", {
      ...valid,
      email: "bad",
    });
    expect(r).toEqual({ ok: false, message: "validation" });
  });

  it("returns db message on insert error", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    mockCreateClient.mockResolvedValue({
      from: () => ({
        insert: vi.fn().mockResolvedValue({
          error: { message: "duplicate" },
        }),
      }),
    });
    const r = await submitPublicRegistration("es", valid);
    expect(r).toEqual({ ok: false, message: "duplicate" });
  });

  it("returns ok on success", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    mockCreateClient.mockResolvedValue({
      from: () => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const r = await submitPublicRegistration("en", valid);
    expect(r).toEqual({ ok: true });
  });
});
