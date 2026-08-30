import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitPublicRegistration } from "@/app/[locale]/register/actions";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import esDict from "@/dictionaries/es.json";
import { validNagoExtras } from "@/__tests__/lib/register/packs/nagoExtrasFixture";

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

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({}),
}));

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail: async () => ({ ok: true, fromOverride: false }),
}));

vi.mock("@/lib/register/resolveExistingStudentByDni", () => ({
  resolveExistingStudentByDni: async () => ({ kind: "none" }),
}));

const mockStampExtras = vi.hoisted(() => vi.fn());
vi.mock("@/lib/register/packs/resolveAndStampTenantExtras", () => ({
  resolveAndStampTenantExtras: (input: unknown) => mockStampExtras(input),
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
  privacy_accepted: true,
};

const minorNoStudentEmailPayload = {
  first_name: "Juan",
  last_name: "Pérez",
  dni: "12-345-K",
  email: "",
  phone: "",
  birth_date: "2015-01-01",
  preferred_section_id: SECTION_ID,
  tutor_name: "María",
  tutor_dni: "999",
  tutor_email: "tutor@example.com",
  tutor_phone: "+200",
  tutor_relationship: "Madre",
  privacy_accepted: true,
};

function mockClientWithRpcAndInsert(insertResult: { error: unknown }) {
  return {
    rpc: vi.fn().mockImplementation((fn: string) => {
      if (fn === "registration_public_section_has_open_seat") {
        return Promise.resolve({ data: true, error: null });
      }
      return Promise.resolve({ data: "Cohort — Section A", error: null });
    }),
    from: () => ({
      insert: vi.fn().mockResolvedValue(insertResult),
    }),
  };
}

describe("submitPublicRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MAIL_TENANT", "");
    mockStampExtras.mockResolvedValue({ ok: true, extras: {} });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("returns closed when inscriptions disabled", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(false);
    const r = await submitPublicRegistration("es", valid);
    expect(r).toEqual({ ok: false, message: esDict.register.closed });
  });

  it("returns validation when privacy is not accepted", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    mockCreateClient.mockResolvedValue(mockClientWithRpcAndInsert({ error: null }));
    const r = await submitPublicRegistration("es", {
      ...valid,
      privacy_accepted: false,
    });
    expect(r).toEqual({ ok: false, message: esDict.register.validationError });
  });

  it("returns validation when body invalid", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    mockCreateClient.mockResolvedValue(mockClientWithRpcAndInsert({ error: null }));
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

  it("returns validation when minor payload includes student email", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    mockCreateClient.mockResolvedValue(mockClientWithRpcAndInsert({ error: null }));
    vi.stubEnv("MAIL_TENANT", "alumnos.test");
    const r = await submitPublicRegistration("es", {
      ...minorNoStudentEmailPayload,
      email: "tampered@x.com",
    });
    expect(r).toEqual({ ok: false, message: esDict.register.validationError });
  });

  it("returns mail tenant missing when minor and MAIL_TENANT unset", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    mockCreateClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: "Cohort — Section A",
        error: null,
      }),
      from: () => ({ insert: vi.fn() }),
    });
    const r = await submitPublicRegistration("es", minorNoStudentEmailPayload);
    expect(r).toEqual({
      ok: false,
      message: esDict.actionErrors.register.mailTenantMissing,
    });
  });

  it("persists synthetic email for minor when MAIL_TENANT set", async () => {
    vi.stubEnv("MAIL_TENANT", "alumnos.test");
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    const insert = vi.fn().mockResolvedValue({ error: null });
    const client = mockClientWithRpcAndInsert({ error: null });
    client.from = () => ({ insert });
    mockCreateClient.mockResolvedValue(client);
    const r = await submitPublicRegistration("es", minorNoStudentEmailPayload);
    expect(r).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "juanperez-12345k@alumnos.test",
      }),
    );
  });

  it("rejects extras when the tenant pack stamp fails", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    const insert = vi.fn();
    mockCreateClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: "Cohort — Section A", error: null }),
      from: () => ({ insert }),
    });
    mockStampExtras.mockResolvedValue({ ok: false });
    const r = await submitPublicRegistration("es", {
      ...valid,
      tenant_extras: validNagoExtras(),
    });
    expect(r).toEqual({ ok: false, message: esDict.register.validationError });
    expect(insert).not.toHaveBeenCalled();
  });

  it("stamps privacy acceptance on a public reserve insert", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T16:00:00.000Z"));
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    const insert = vi.fn().mockResolvedValue({ error: null });
    const client = mockClientWithRpcAndInsert({ error: null });
    client.from = () => ({ insert });
    mockCreateClient.mockResolvedValue(client);
    const r = await submitPublicRegistration("es", valid);
    expect(r).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        privacy_accepted_at: "2026-08-29T16:00:00.000Z",
        privacy_policy_version: "2026-08-29",
      }),
    );
    vi.useRealTimers();
  });

  it("persists stamped Nagô extras on insert", async () => {
    mockGetInscriptionsEnabled.mockResolvedValue(true);
    const extras = validNagoExtras({
      protocol: {
        version: "2026-08",
        acceptedAt: "2026-08-26T15:00:00.000Z",
        signerName: "Ada Lovelace",
        signerDni: "123",
      },
    });
    mockStampExtras.mockResolvedValue({ ok: true, extras });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const client = mockClientWithRpcAndInsert({ error: null });
    client.from = () => ({ insert });
    mockCreateClient.mockResolvedValue(client);
    const r = await submitPublicRegistration("es", {
      ...valid,
      tenant_extras: validNagoExtras(),
    });
    expect(r).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_extras: extras }),
    );
  });
});
