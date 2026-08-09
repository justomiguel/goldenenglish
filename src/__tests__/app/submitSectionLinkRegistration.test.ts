/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { composeSyntheticMinorStudentEmail } from "@/lib/register/composeSyntheticMinorStudentEmail";

const insert = vi.fn();
const rpc = vi.fn();
const from = vi.fn(() => ({ insert }));
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from, rpc }),
}));

vi.mock("@/lib/brand/legalAge", () => ({
  getLegalAgeMajorityFromSystem: () => 18,
}));

vi.mock("@/lib/register/registrationMailTenant", () => ({
  getRegistrationMailTenantDomain: () => "tenant.test",
}));

vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: async () => ({
    register: {
      closed: "cerrado",
      validationError: "validación",
      invalidSectionOption: "sección inválida",
      tutorEmailSameAsStudent: "igual",
      sectionLink: { unavailableClosed: "cerrado" },
    },
    actionErrors: {
      register: { insertFailed: "insert falló", mailTenantMissing: "sin tenant" },
    },
  }),
}));

const TOKEN = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
/** Real ids come from gen_random_uuid(); zod 4 rejects UUIDs with a non-RFC version/variant. */
const SECTION = "11111111-1111-4111-8111-111111111111";
const OTHER_SECTION = "99999999-9999-4999-a999-999999999999";

const adult = {
  first_name: "Ana",
  last_name: "Pérez",
  dni: "12345678",
  email: "ana@example.com",
  phone: "3624000000",
  birth_date: "1990-05-04",
  preferred_section_id: SECTION,
};

const minor = {
  first_name: "Luca",
  last_name: "Gómez",
  dni: "55667788",
  email: "",
  phone: "",
  birth_date: "2016-03-02",
  preferred_section_id: SECTION,
  tutor_name: "Marta Gómez",
  tutor_dni: "22334455",
  tutor_email: "marta@example.com",
  tutor_phone: "3624111111",
  tutor_relationship: "madre",
};

async function submit(token: string, raw: Record<string, unknown>) {
  const { submitSectionLinkRegistration } = await import(
    "@/app/[locale]/i/[token]/actions"
  );
  return submitSectionLinkRegistration("es", token, raw as never);
}

function resolvesTo(sectionId: string | null) {
  rpc.mockImplementation((fn: string) => {
    if (fn === "resolve_section_enrollment_link") {
      return Promise.resolve({
        data: sectionId
          ? [
              {
                section_id: sectionId,
                section_name: "Sección B",
                cohort_name: "Ciclo 2026",
                schedule_slots: [],
                seats_remaining: 3,
              },
            ]
          : [],
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
}

describe("submitSectionLinkRegistration", () => {
  beforeEach(() => {
    vi.resetModules();
    insert.mockReset();
    from.mockClear();
    rpc.mockReset();
    revalidatePath.mockReset();
    insert.mockResolvedValue({ error: null });
    resolvesTo(SECTION);
  });

  it("rejects a malformed token without touching the database", async () => {
    await expect(submit("not-a-token", adult)).resolves.toMatchObject({ ok: false });
    expect(insert).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a token that no longer resolves", async () => {
    resolvesTo(null);
    const res = await submit(TOKEN, adult);
    expect(res.ok).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts the lead bound to the section the token resolves to", async () => {
    const res = await submit(TOKEN, adult);
    expect(res.ok).toBe(true);
    // The section comes from resolving the URL token, and the lead lands in the inbox table.
    expect(rpc).toHaveBeenCalledWith("resolve_section_enrollment_link", {
      p_token: TOKEN,
    });
    expect(from).toHaveBeenCalledWith("registrations");
    const row = insert.mock.calls[0][0];
    expect(row).toMatchObject({
      first_name: "Ana",
      email: "ana@example.com",
      phone: "3624000000",
      status: "new",
      preferred_section_id: SECTION,
      source_section_link_id: SECTION,
      level_interest: "Ciclo 2026 — Sección B",
    });
  });

  // The token is the authorization; a section id posted by the client is not.
  it("ignores a section id supplied by the client", async () => {
    const res = await submit(TOKEN, {
      ...adult,
      preferred_section_id: OTHER_SECTION,
    });
    expect(res.ok).toBe(true);
    const row = insert.mock.calls[0][0];
    expect(row.preferred_section_id).toBe(SECTION);
    expect(row.source_section_link_id).toBe(SECTION);
  });

  it("stores a minor with tutor data, a synthetic email and no phone", async () => {
    const res = await submit(TOKEN, minor);
    expect(res.ok).toBe(true);
    const row = insert.mock.calls[0][0];
    expect(row.phone).toBeNull();
    expect(String(row.email)).toContain("@tenant.test");
    expect(row).toMatchObject({
      tutor_name: "Marta Gómez",
      tutor_dni: "22334455",
      tutor_email: "marta@example.com",
      tutor_phone: "3624111111",
      tutor_relationship: "madre",
    });
  });

  it("retries a minor insert on a duplicate email, then succeeds", async () => {
    insert
      .mockResolvedValueOnce({ error: { code: "23505", message: "duplicate" } })
      .mockResolvedValueOnce({ error: null });
    const res = await submit(TOKEN, minor);
    expect(res.ok).toBe(true);
    expect(insert).toHaveBeenCalledTimes(2);
    const firstEmail = insert.mock.calls[0][0].email;
    const secondEmail = insert.mock.calls[1][0].email;
    expect(firstEmail).not.toBe(secondEmail);
  });

  it("rejects invalid input before inserting", async () => {
    const res = await submit(TOKEN, { ...adult, first_name: "" });
    expect(res.ok).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it("refreshes the admin inbox after a successful insert", async () => {
    await submit(TOKEN, adult);
    expect(revalidatePath).toHaveBeenCalledWith(
      "/es/dashboard/admin/registrations",
      "page",
    );
  });

  // Reporting success on a rejected insert would tell a family it is enrolled when
  // nothing was stored, and there is no second channel to catch that.
  it("reports failure and does not refresh when the insert is rejected", async () => {
    insert.mockResolvedValue({ error: { code: "23503", message: "fk" } });
    const res = await submit(TOKEN, adult);
    expect(res.ok).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("refuses a minor whose tutor email is the student's synthetic address", async () => {
    const synthetic = composeSyntheticMinorStudentEmail(
      minor.first_name,
      minor.last_name,
      minor.dni,
      "tenant.test",
    ).toLowerCase();
    const res = await submit(TOKEN, { ...minor, tutor_email: synthetic });
    expect(res.ok).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });
});
