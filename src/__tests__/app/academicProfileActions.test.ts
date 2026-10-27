/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_SESSION_FORBIDDEN } from "@/lib/dashboard/adminSessionErrors";
import { saveAcademicProfileFieldAction } from "@/app/[locale]/dashboard/admin/users/academicProfileFieldActions";
import { saveAcademicProfileValueAction } from "@/app/[locale]/dashboard/admin/users/academicProfileValueActions";

const FIELD = "11111111-1111-4111-8111-111111111111";
const STUDENT = "22222222-2222-4222-8222-222222222222";
const SECTION = "33333333-3333-4333-8333-333333333333";
const TEACHER = "44444444-4444-4444-8444-444444444444";

const mockAssertAdmin = vi.fn();
const mockAssertTeacher = vi.fn();
const mockAudit = vi.fn();

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));
vi.mock("@/lib/dashboard/assertTeacher", () => ({
  assertTeacher: () => mockAssertTeacher(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn(),
}));
vi.mock("@/lib/academic-profile/auditAcademicProfileStaffAction", () => ({
  auditAcademicProfileStaffAction: (...args: unknown[]) => mockAudit(...args),
}));

const fieldInsert = vi.fn();

function adminFieldClient() {
  return {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: async () => ({ data: { sort_order: 2 }, error: null }),
          }),
        }),
      }),
      insert: (row: unknown) => {
        fieldInsert(row);
        return { select: () => ({ single: async () => ({ data: { id: FIELD }, error: null }) }) };
      },
    }),
  };
}

const valueUpsert = vi.fn().mockResolvedValue({ error: null });

function valueClient(input: { teacherId: string; required: boolean }) {
  return {
    from: (table: string) => {
      if (table === "academic_profile_fields") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { required: input.required, field_type: "text", archived_at: null },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "academic_sections") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { teacher_id: input.teacherId, archived_at: null },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "academic_section_assistants") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
            }),
          }),
        };
      }
      if (table === "section_enrollments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: { student_id: STUDENT }, error: null }) }),
            }),
          }),
        };
      }
      return { upsert: valueUpsert };
    },
  };
}

describe("saveAcademicProfileFieldAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores an image field with the column forced off", async () => {
    mockAssertAdmin.mockResolvedValue({ user: { id: TEACHER }, supabase: adminFieldClient() });
    const result = await saveAcademicProfileFieldAction({
      locale: "es",
      label: "Foto",
      fieldType: "image",
      selectOptions: [],
      required: false,
      showInDirectory: true,
    });
    expect(result).toEqual({ ok: true, id: FIELD });
    expect(fieldInsert).toHaveBeenCalledWith(expect.objectContaining({ show_in_directory: false, field_type: "image" }));
  });

  it("rejects a teacher", async () => {
    mockAssertAdmin.mockRejectedValue(new Error(ADMIN_SESSION_FORBIDDEN));
    const result = await saveAcademicProfileFieldAction({
      locale: "es",
      label: "Nivel",
      fieldType: "text",
      selectOptions: [],
      required: false,
      showInDirectory: false,
    });
    expect(result).toEqual({ ok: false, error: "forbidden" });
  });
});

describe("saveAcademicProfileValueAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets a lead teacher save and audits only the ids", async () => {
    mockAssertAdmin.mockRejectedValue(new Error(ADMIN_SESSION_FORBIDDEN));
    mockAssertTeacher.mockResolvedValue({
      user: { id: TEACHER },
      profileId: TEACHER,
      supabase: valueClient({ teacherId: TEACHER, required: false }),
    });
    const result = await saveAcademicProfileValueAction({
      locale: "es",
      studentId: STUDENT,
      fieldId: FIELD,
      sectionId: SECTION,
      valueText: "B1",
    });
    expect(result).toEqual({ ok: true });
    expect(valueUpsert).toHaveBeenCalled();
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { fieldId: FIELD, studentId: STUDENT } }),
    );
  });

  it("rejects a teacher who is not the lead or a listed assistant", async () => {
    mockAssertAdmin.mockRejectedValue(new Error(ADMIN_SESSION_FORBIDDEN));
    mockAssertTeacher.mockResolvedValue({
      user: { id: TEACHER },
      profileId: TEACHER,
      supabase: valueClient({ teacherId: "55555555-5555-4555-8555-555555555555", required: false }),
    });
    const result = await saveAcademicProfileValueAction({
      locale: "es",
      studentId: STUDENT,
      fieldId: FIELD,
      sectionId: SECTION,
      valueText: "B1",
    });
    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(valueUpsert).not.toHaveBeenCalled();
  });

  it("rejects an empty required value", async () => {
    mockAssertAdmin.mockResolvedValue({
      user: { id: TEACHER },
      supabase: valueClient({ teacherId: TEACHER, required: true }),
    });
    const result = await saveAcademicProfileValueAction({
      locale: "es",
      studentId: STUDENT,
      fieldId: FIELD,
      valueText: "  ",
    });
    expect(result).toEqual({ ok: false, error: "required" });
    expect(valueUpsert).not.toHaveBeenCalled();
  });
});
