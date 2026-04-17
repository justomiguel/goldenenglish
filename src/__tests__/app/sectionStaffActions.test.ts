/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  replaceAcademicSectionAssistantsAction,
  updateAcademicSectionTeacherAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionStaffActions";

const { mockAssertAdmin, recordSystemAudit, revalidatePath } = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces: vi.fn(),
}));

const { previewStudentAssistantScheduleConflicts } = vi.hoisted(() => ({
  previewStudentAssistantScheduleConflicts: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/academics/previewStudentAssistantScheduleConflicts", () => ({
  previewStudentAssistantScheduleConflicts,
}));

function makeProfileLookup(role: string | null) {
  return vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: role ? { id: "new-t", role } : null, error: null }),
      }),
    }),
  });
}

function makeSectionTables(opts?: {
  current?: { id: string; cohort_id: string; teacher_id: string };
  next?: { id: string; cohort_id: string; teacher_id: string };
}) {
  const current = opts?.current ?? { id: "sec-1", cohort_id: "coh-1", teacher_id: "old-t" };
  const next = opts?.next ?? { id: "sec-1", cohort_id: "coh-1", teacher_id: "new-t" };
  const sectionSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: current, error: null }),
    }),
  });
  const sectionUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: next, error: null }),
      }),
    }),
  });
  const assistantsDelete = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
  });
  return { sectionSelect, sectionUpdate, assistantsDelete };
}

describe("updateAcademicSectionTeacherAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a teacher profile as the new lead", async () => {
    const profilesSelect = makeProfileLookup("teacher");
    const { sectionSelect, sectionUpdate, assistantsDelete } = makeSectionTables();
    const from = vi.fn((table: string) => {
      if (table === "profiles") return { select: profilesSelect };
      if (table === "academic_sections") return { select: sectionSelect, update: sectionUpdate };
      if (table === "academic_section_assistants") return { delete: assistantsDelete };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionTeacherAction({
      locale: "es",
      sectionId: "00000000-0000-4000-8000-000000000001",
      teacherId: "00000000-0000-4000-8000-000000000002",
    });
    expect(r).toEqual({ ok: true });
  });

  it("accepts an admin profile as the new lead (institute admins can also teach)", async () => {
    const profilesSelect = makeProfileLookup("admin");
    const { sectionSelect, sectionUpdate, assistantsDelete } = makeSectionTables();
    const from = vi.fn((table: string) => {
      if (table === "profiles") return { select: profilesSelect };
      if (table === "academic_sections") return { select: sectionSelect, update: sectionUpdate };
      if (table === "academic_section_assistants") return { delete: assistantsDelete };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionTeacherAction({
      locale: "es",
      sectionId: "00000000-0000-4000-8000-000000000001",
      teacherId: "00000000-0000-4000-8000-000000000002",
    });
    expect(r).toEqual({ ok: true });
  });

  it("rejects a parent profile as the new lead", async () => {
    const profilesSelect = makeProfileLookup(null);
    const { sectionSelect, sectionUpdate, assistantsDelete } = makeSectionTables();
    const from = vi.fn((table: string) => {
      if (table === "profiles") return { select: profilesSelect };
      if (table === "academic_sections") return { select: sectionSelect, update: sectionUpdate };
      if (table === "academic_section_assistants") return { delete: assistantsDelete };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionTeacherAction({
      locale: "es",
      sectionId: "00000000-0000-4000-8000-000000000001",
      teacherId: "00000000-0000-4000-8000-000000000002",
    });
    expect(r).toEqual({ ok: false });
    expect(sectionUpdate).not.toHaveBeenCalled();
  });
});

describe("replaceAcademicSectionAssistantsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeSectionLookup(teacher_id = "lead-1") {
    return vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "sec-1", cohort_id: "coh-1", teacher_id },
          error: null,
        }),
      }),
    });
  }

  function makeProfilesIn(rows: { id: string; role: string }[]) {
    const second = vi.fn().mockResolvedValue({ data: rows, error: null });
    const first = vi.fn().mockReturnValue({ in: second });
    return vi.fn().mockReturnValue({ in: first });
  }

  it("accepts admin profiles in the assistant list", async () => {
    const sectionSelect = makeSectionLookup();
    const adminAssistantId = "00000000-0000-4000-8000-000000000007";
    const profilesSelect = makeProfilesIn([{ id: adminAssistantId, role: "admin" }]);
    const assistantsDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const assistantsInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "academic_sections") return { select: sectionSelect };
      if (table === "profiles") return { select: profilesSelect };
      if (table === "academic_section_assistants") return { delete: assistantsDelete, insert: assistantsInsert };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await replaceAcademicSectionAssistantsAction({
      locale: "es",
      sectionId: "00000000-0000-4000-8000-000000000001",
      assistantIds: [adminAssistantId],
    });
    expect(r).toEqual({ ok: true });
    expect(assistantsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ assistant_id: adminAssistantId })]),
    );
  });

  it("accepts mixed teacher and assistant profile roles", async () => {
    const sectionSelect = makeSectionLookup();
    const profilesSelect = makeProfilesIn([
      { id: "00000000-0000-4000-8000-000000000003", role: "teacher" },
      { id: "00000000-0000-4000-8000-000000000004", role: "assistant" },
    ]);
    const assistantsDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const assistantsInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "academic_sections") return { select: sectionSelect };
      if (table === "profiles") return { select: profilesSelect };
      if (table === "academic_section_assistants") return { delete: assistantsDelete, insert: assistantsInsert };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await replaceAcademicSectionAssistantsAction({
      locale: "es",
      sectionId: "00000000-0000-4000-8000-000000000001",
      assistantIds: [
        "00000000-0000-4000-8000-000000000003",
        "00000000-0000-4000-8000-000000000004",
      ],
    });
    expect(r).toEqual({ ok: true });
    expect(previewStudentAssistantScheduleConflicts).not.toHaveBeenCalled();
  });

  it("rejects student assistant when schedule overlaps other enrollments", async () => {
    previewStudentAssistantScheduleConflicts.mockResolvedValueOnce({ ok: false, code: "SCHEDULE_OVERLAP" });
    const sectionSelect = makeSectionLookup();
    const sid = "00000000-0000-4000-8000-000000000099";
    const profilesSelect = makeProfilesIn([{ id: sid, role: "student" }]);
    const assistantsDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") return { select: sectionSelect };
      if (table === "profiles") return { select: profilesSelect };
      if (table === "academic_section_assistants") return { delete: assistantsDelete, insert: vi.fn() };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await replaceAcademicSectionAssistantsAction({
      locale: "es",
      sectionId: "00000000-0000-4000-8000-000000000001",
      assistantIds: [sid],
    });
    expect(r).toEqual({ ok: false, code: "SCHEDULE_OVERLAP" });
    expect(previewStudentAssistantScheduleConflicts).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sectionId: "00000000-0000-4000-8000-000000000001", studentProfileId: sid }),
    );
  });
});
