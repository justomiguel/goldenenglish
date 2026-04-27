import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";

const R = es.admin.registrations;
const U = es.admin.users;
import {
  acceptRegistration,
  deleteRegistration,
} from "@/app/[locale]/dashboard/admin/registrations/actions";
import { REGISTRATION_LEVEL_INTEREST_UNDECIDED } from "@/lib/register/registrationSectionConstants";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockCreateUser = vi.fn();
vi.mock("@/app/[locale]/dashboard/admin/users/actions", () => ({
  createDashboardUser: (...args: unknown[]) => mockCreateUser(...args),
}));

const mockAuthCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      admin: {
        createUser: (...args: unknown[]) => mockAuthCreateUser(...args),
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
  }),
}));

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";
const COURSE_ID = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

const regNew = {
  id: REG_ID,
  status: "new",
  first_name: "A",
  last_name: "B",
  dni: "123",
  email: "a@test.com",
  phone: "+1",
  birth_date: "2010-05-01",
  level_interest: "B1",
  tutor_name: null,
  tutor_dni: null,
  tutor_email: null,
  tutor_phone: null,
  tutor_relationship: null,
};

function mockCoursesTable(courseId: string | null) {
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: courseId ? { id: courseId } : null,
                error: null,
              }),
          }),
        }),
      }),
    }),
  };
}

function mockEnrollmentsTable(opts?: { exists?: boolean; insertError?: unknown }) {
  const exists = opts?.exists ?? false;
  const insert = vi.fn().mockResolvedValue({ error: opts?.insertError ?? null });
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: exists ? { id: "e1" } : null,
              error: null,
            }),
        }),
      }),
    }),
    insert,
  };
}

describe("deleteRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Forbidden when not admin", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await deleteRegistration("es", regNew.id);
    expect(r).toEqual({ ok: false, message: es.actionErrors.registrationDelete.forbidden });
  });

  it("deletes and returns ok", async () => {
    mockAssertAdmin.mockResolvedValue({
      user: { id: "11111111-1111-1111-1111-111111111111" },
    });
    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: regNew.id, first_name: "A", last_name: "B", status: "new" },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle,
        }),
      }),
      delete: () => ({
        eq: eqDelete,
      }),
    });
    const r = await deleteRegistration("es", regNew.id);
    expect(r.ok).toBe(true);
    expect(eqDelete).toHaveBeenCalledWith("id", regNew.id);
  });
});

describe("acceptRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCreateUser.mockReset();
    mockDeleteUser.mockReset().mockResolvedValue({ data: {}, error: null });
  });

  it("returns Forbidden when not admin", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await acceptRegistration("es", {
      registration_id: regNew.id,
    });
    expect(r).toEqual({ ok: false, message: U.errCreateForbidden });
  });

  it("returns Not found when row missing", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r).toEqual({ ok: false, message: U.errCreateNotFound });
  });

  it("returns already_processed when status is not new", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: { ...regNew, status: "enrolled" }, error: null }),
        }),
      }),
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r).toEqual({ ok: false, message: R.alreadyProcessed });
  });

  it("returns birth_date_required when birth missing", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { ...regNew, birth_date: null },
              error: null,
            }),
        }),
      }),
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r).toEqual({ ok: false, message: R.errBirthDateRequired });
  });

  it("returns minor_requires_tutor_dni when minor without tutor dni", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                ...regNew,
                birth_date: "2018-01-01",
                tutor_dni: null,
              },
              error: null,
            }),
        }),
      }),
    });
    const r = await acceptRegistration("es", {
      registration_id: regNew.id,
      birth_date: "2018-01-01",
    });
    expect(r).toEqual({ ok: false, message: R.errMinorRequiresTutorDni });
  });

  it("creates student without course when no course matches level (legacy)", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({ ok: true, userId: "stu-legacy" });
    const enrollmentsFrom = mockEnrollmentsTable();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") return mockCoursesTable(null);
      if (table === "enrollments") return enrollmentsFrom;
      if (table === "tutor_student_rel") {
        return { upsert: () => Promise.resolve({ error: null }) };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { ...regNew, birth_date: "1990-01-01" },
                error: null,
              }),
          }),
        }),
        update: () => ({
          eq: updateEq,
        }),
      };
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r).toEqual({ ok: true, studentId: "stu-legacy" });
    expect(mockCreateUser).toHaveBeenCalled();
    expect(enrollmentsFrom.insert).not.toHaveBeenCalled();
  });

  it("uses registration birth_date when accept payload omits birth_date", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({ ok: true, userId: "stu-1" });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") return mockCoursesTable(COURSE_ID);
      if (table === "enrollments") return mockEnrollmentsTable();
      if (table === "tutor_student_rel") {
        return { upsert: () => Promise.resolve({ error: null }) };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { ...regNew, birth_date: "2008-03-15" },
                error: null,
              }),
          }),
        }),
        update: () => ({
          eq: updateEq,
        }),
      };
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r.ok).toBe(true);
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ birth_date: "2008-03-15", locale: "es" }),
    );
  });

  it("creates student without course enrollment when request was section-undecided", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({ ok: true, userId: "stu-u" });
    const enrollmentsFrom = mockEnrollmentsTable();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") return mockCoursesTable(COURSE_ID);
      if (table === "enrollments") return enrollmentsFrom;
      if (table === "tutor_student_rel") {
        return { upsert: () => Promise.resolve({ error: null }) };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  ...regNew,
                  birth_date: "1995-04-01",
                  preferred_section_id: null,
                  level_interest: REGISTRATION_LEVEL_INTEREST_UNDECIDED,
                },
                error: null,
              }),
          }),
        }),
        update: () => ({
          eq: updateEq,
        }),
      };
    });
    const r = await acceptRegistration("es", {
      registration_id: regNew.id,
      birth_date: "1995-04-01",
    });
    expect(r.ok).toBe(true);
    expect(enrollmentsFrom.insert).not.toHaveBeenCalled();
  });

  it("creates student only for adult birth year", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({ ok: true, userId: "stu-adult" });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") return mockCoursesTable(COURSE_ID);
      if (table === "enrollments") return mockEnrollmentsTable();
      if (table === "tutor_student_rel") {
        return { upsert: () => Promise.resolve({ error: null }) };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { ...regNew, birth_date: "1995-04-01" },
                error: null,
              }),
          }),
        }),
        update: () => ({
          eq: updateEq,
        }),
      };
    });
    const r = await acceptRegistration("es", {
      registration_id: regNew.id,
      password: "",
      birth_date: "1995-04-01",
    });
    expect(r.ok).toBe(true);
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    expect(mockAuthCreateUser).not.toHaveBeenCalled();
  });

  it("creates parent and link for minor with tutor data", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValueOnce({ ok: true, userId: "stu-min" });
    mockAuthCreateUser.mockResolvedValue({
      data: { user: { id: "par-1" } },
      error: null,
    });
    const profilesSelect = vi.fn().mockReturnValue({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
    });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") return mockCoursesTable(COURSE_ID);
      if (table === "enrollments") return mockEnrollmentsTable();
      if (table === "profiles") return { select: profilesSelect };
      if (table === "tutor_student_rel") return { upsert };
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  ...regNew,
                  birth_date: "2015-06-01",
                  tutor_name: "Ana Gómez",
                  tutor_dni: "30111222",
                  tutor_email: "ana@test.com",
                  tutor_phone: "+54911",
                  tutor_relationship: "Madre",
                },
                error: null,
              }),
          }),
        }),
        update: () => ({
          eq: updateEq,
        }),
      };
    });
    const r = await acceptRegistration("es", {
      registration_id: regNew.id,
      birth_date: "2015-06-01",
    });
    expect(r.ok).toBe(true);
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    expect(mockAuthCreateUser).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalled();
  });

  it("calls deleteUser when enrollment insert fails", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({ ok: true, userId: "stu-x" });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const enroll = mockEnrollmentsTable({ insertError: { message: "db" } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") return mockCoursesTable(COURSE_ID);
      if (table === "enrollments") return enroll;
      if (table === "tutor_student_rel") {
        return { upsert: () => Promise.resolve({ error: null }) };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { ...regNew, birth_date: "1992-01-01" },
                error: null,
              }),
          }),
        }),
        update: () => ({
          eq: updateEq,
        }),
      };
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r).toEqual({ ok: false, message: R.errEnrollmentFailed });
    expect(mockDeleteUser).toHaveBeenCalledWith("stu-x");
    expect(updateEq).not.toHaveBeenCalled();
  });

  it("returns rollback_failed when enrollment fails and delete fails", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({ ok: true, userId: "stu-y" });
    mockDeleteUser.mockResolvedValue({ data: null, error: { message: "nope" } });
    const enroll = mockEnrollmentsTable({ insertError: { message: "db" } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") return mockCoursesTable(COURSE_ID);
      if (table === "enrollments") return enroll;
      if (table === "tutor_student_rel") {
        return { upsert: () => Promise.resolve({ error: null }) };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { ...regNew, birth_date: "1992-01-01" },
                error: null,
              }),
          }),
        }),
        update: () => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r).toEqual({ ok: false, message: R.errRollbackFailed });
  });

  it("forwards createDashboardUser failure", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateUser.mockResolvedValue({ ok: false, message: U.errCreateAuth });
    mockFrom.mockImplementation((table: string) => {
      if (table === "courses") return mockCoursesTable(COURSE_ID);
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { ...regNew, birth_date: "1990-01-01" },
                error: null,
              }),
          }),
        }),
      };
    });
    const r = await acceptRegistration("es", { registration_id: regNew.id });
    expect(r).toEqual({ ok: false, message: U.errCreateAuth });
  });
});
