/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc }),
}));

describe("lookupRegistrationStudent", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("does not call the RPC when the document is empty after normalize", async () => {
    const { lookupRegistrationStudent } = await import(
      "@/lib/register/lookupRegistrationStudent"
    );
    const r = await lookupRegistrationStudent("  . . ");
    expect(r).toEqual({ ok: true, found: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps a found student row", async () => {
    rpc.mockResolvedValue({
      data: [{ found: true, first_name: "Ana", last_name: "Pérez" }],
      error: null,
    });
    const { lookupRegistrationStudent } = await import(
      "@/lib/register/lookupRegistrationStudent"
    );
    const r = await lookupRegistrationStudent("12.345.678");
    expect(rpc).toHaveBeenCalledWith("lookup_registration_student", {
      p_dni: "12.345.678",
    });
    expect(r).toEqual({
      ok: true,
      found: true,
      firstName: "Ana",
      lastName: "Pérez",
    });
  });

  it("maps found=false", async () => {
    rpc.mockResolvedValue({
      data: [{ found: false, first_name: null, last_name: null }],
      error: null,
    });
    const { lookupRegistrationStudent } = await import(
      "@/lib/register/lookupRegistrationStudent"
    );
    const r = await lookupRegistrationStudent("999");
    expect(r).toEqual({ ok: true, found: false });
  });

  it("returns ok false when the RPC errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { lookupRegistrationStudent } = await import(
      "@/lib/register/lookupRegistrationStudent"
    );
    const r = await lookupRegistrationStudent("123");
    expect(r).toEqual({ ok: false });
  });
});
