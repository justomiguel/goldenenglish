/** @vitest-environment node */
// REGRESSION CHECK: lookupRegistrationStudent maps student and tutor prefill fields and strips synthetic internal emails.
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

  it("maps a found student row with student and tutor prefill fields", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          found: true,
          first_name: "Ana",
          last_name: "Pérez",
          birth_date: "2014-05-10",
          phone: "+56911112222",
          email: "ana@example.com",
          tutor_name: "Carlos Pérez",
          tutor_dni: "11.222.333-4",
          tutor_email: "carlos@example.com",
          tutor_phone: "+56933334444",
          tutor_relationship: "father",
        },
      ],
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
      birthDate: "2014-05-10",
      phone: "+56911112222",
      email: "ana@example.com",
      tutorName: "Carlos Pérez",
      tutorDni: "11.222.333-4",
      tutorEmail: "carlos@example.com",
      tutorPhone: "+56933334444",
      tutorRelationship: "father",
    });
  });

  it("strips synthetic student and tutor emails from prefill output", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          found: true,
          first_name: "Ana",
          last_name: "Pérez",
          birth_date: "2014-05-10",
          phone: null,
          email: "anaperez-12345678@students.goldenenglish.local",
          tutor_name: "Carlos Pérez",
          tutor_dni: "11222333",
          tutor_email: "11222333@parents.goldenenglish.local",
          tutor_phone: "+56933334444",
          tutor_relationship: "father",
        },
      ],
      error: null,
    });
    const { lookupRegistrationStudent } = await import(
      "@/lib/register/lookupRegistrationStudent"
    );
    const r = await lookupRegistrationStudent("12345678");
    expect(r).toMatchObject({
      ok: true,
      found: true,
      email: "",
      tutorEmail: "",
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
