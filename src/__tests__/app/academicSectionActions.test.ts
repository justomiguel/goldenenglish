/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAcademicSectionAction,
  updateAcademicSectionScheduleAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionActions";

const {
  mockAssertAdmin,
  recordSystemAudit,
  revalidatePath,
} = vi.hoisted(() => ({
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

describe("academic section actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects creating a section without at least one valid schedule slot", async () => {
    const result = await createAcademicSectionAction({
      locale: "en",
      cohortId: "00000000-0000-4000-8000-000000000001",
      name: "Morning A1",
      teacherId: "00000000-0000-4000-8000-000000000002",
      startsOn: "2026-01-01",
      endsOn: "2026-12-31",
      scheduleSlots: [],
    });

    expect(result).toEqual({ ok: false });
    expect(mockAssertAdmin).not.toHaveBeenCalled();
  });

  it("creates a section with normalized schedule slots", async () => {
    const cohortMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "cohort-1",
        archived_at: null,
        starts_on: "2026-01-01",
        ends_on: "2026-12-31",
      },
    });
    const cohortEq = vi.fn().mockReturnValue({ maybeSingle: cohortMaybeSingle });
    const cohortSelect = vi.fn().mockReturnValue({ eq: cohortEq });

    const teacherMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "teacher-1", role: "teacher" } });
    const teacherIn = vi.fn().mockReturnValue({ maybeSingle: teacherMaybeSingle });
    const teacherEqId = vi.fn().mockReturnValue({ in: teacherIn });
    const teacherSelect = vi.fn().mockReturnValue({ eq: teacherEqId });

    const insertSingle = vi.fn().mockResolvedValue({ data: { id: "section-1" }, error: null });
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
    const insert = vi.fn().mockReturnValue({ select: insertSelect });

    const from = vi.fn((table: string) => {
      if (table === "academic_cohorts") return { select: cohortSelect };
      if (table === "profiles") return { select: teacherSelect };
      if (table === "academic_sections") return { insert };
      throw new Error(`Unexpected table ${table}`);
    });

    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const result = await createAcademicSectionAction({
      locale: "en",
      cohortId: "00000000-0000-4000-8000-000000000001",
      name: "Morning A1",
      teacherId: "00000000-0000-4000-8000-000000000002",
      startsOn: "2026-01-15",
      endsOn: "2026-06-30",
      scheduleSlots: [
        { dayOfWeek: 4, startTime: "18:00", endTime: "19:00" },
        { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      ],
    });

    expect(result).toEqual({ ok: true, id: "section-1" });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        starts_on: "2026-01-15",
        ends_on: "2026-06-30",
        schedule_slots: [
          { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
          { dayOfWeek: 4, startTime: "18:00", endTime: "19:00" },
        ],
      }),
    );
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academic_section_created",
        resourceId: "section-1",
      }),
    );
  });

  it("creates a section with an admin profile as the lead teacher (admins can also teach)", async () => {
    const cohortMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "cohort-1", archived_at: null, starts_on: "2026-01-01", ends_on: "2026-12-31" },
    });
    const cohortEq = vi.fn().mockReturnValue({ maybeSingle: cohortMaybeSingle });
    const cohortSelect = vi.fn().mockReturnValue({ eq: cohortEq });

    const teacherMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: "admin-1", role: "admin" } });
    const teacherIn = vi.fn().mockReturnValue({ maybeSingle: teacherMaybeSingle });
    const teacherEqId = vi.fn().mockReturnValue({ in: teacherIn });
    const teacherSelect = vi.fn().mockReturnValue({ eq: teacherEqId });

    const insertSingle = vi.fn().mockResolvedValue({ data: { id: "section-2" }, error: null });
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
    const insert = vi.fn().mockReturnValue({ select: insertSelect });

    const from = vi.fn((table: string) => {
      if (table === "academic_cohorts") return { select: cohortSelect };
      if (table === "profiles") return { select: teacherSelect };
      if (table === "academic_sections") return { insert };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const result = await createAcademicSectionAction({
      locale: "en",
      cohortId: "00000000-0000-4000-8000-000000000001",
      name: "Admin-led A2",
      teacherId: "00000000-0000-4000-8000-000000000010",
      startsOn: "2026-02-01",
      endsOn: "2026-06-30",
      scheduleSlots: [{ dayOfWeek: 2, startTime: "10:00", endTime: "11:00" }],
    });

    expect(result).toEqual({ ok: true, id: "section-2" });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ teacher_id: "00000000-0000-4000-8000-000000000010" }),
    );
  });

  it("rejects creating a section with a non-staff role (e.g. parent) as the lead teacher", async () => {
    const cohortMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "cohort-1", archived_at: null, starts_on: "2026-01-01", ends_on: "2026-12-31" },
    });
    const cohortEq = vi.fn().mockReturnValue({ maybeSingle: cohortMaybeSingle });
    const cohortSelect = vi.fn().mockReturnValue({ eq: cohortEq });

    const teacherMaybeSingle = vi.fn().mockResolvedValue({ data: null });
    const teacherIn = vi.fn().mockReturnValue({ maybeSingle: teacherMaybeSingle });
    const teacherEqId = vi.fn().mockReturnValue({ in: teacherIn });
    const teacherSelect = vi.fn().mockReturnValue({ eq: teacherEqId });

    const insert = vi.fn();
    const from = vi.fn((table: string) => {
      if (table === "academic_cohorts") return { select: cohortSelect };
      if (table === "profiles") return { select: teacherSelect };
      if (table === "academic_sections") return { insert };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const result = await createAcademicSectionAction({
      locale: "en",
      cohortId: "00000000-0000-4000-8000-000000000001",
      name: "X",
      teacherId: "00000000-0000-4000-8000-000000000088",
      startsOn: "2026-02-01",
      endsOn: "2026-06-30",
      scheduleSlots: [{ dayOfWeek: 2, startTime: "10:00", endTime: "11:00" }],
    });

    expect(result).toEqual({ ok: false });
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects clearing all schedule slots on update (a section must keep at least one slot)", async () => {
    const result = await updateAcademicSectionScheduleAction({
      locale: "en",
      sectionId: "00000000-0000-4000-8000-000000000003",
      scheduleSlots: [],
    });

    expect(result).toEqual({ ok: false });
    expect(mockAssertAdmin).not.toHaveBeenCalled();
    expect(recordSystemAudit).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("updates the schedule and audits when at least one valid slot is provided", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "section-1",
        cohort_id: "00000000-0000-4000-8000-000000000001",
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });

    mockAssertAdmin.mockResolvedValue({
      supabase: { from: vi.fn().mockReturnValue({ update }) },
    });

    const result = await updateAcademicSectionScheduleAction({
      locale: "en",
      sectionId: "00000000-0000-4000-8000-000000000003",
      scheduleSlots: [{ dayOfWeek: 3, startTime: "09:00", endTime: "10:00" }],
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      schedule_slots: [{ dayOfWeek: 3, startTime: "09:00", endTime: "10:00" }],
    });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academic_section_schedule_updated",
        resourceId: "section-1",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      "/en/dashboard/admin/academic/00000000-0000-4000-8000-000000000001/section-1",
      "page",
    );
  });

  it("rejects invalid slot ranges on update", async () => {
    const result = await updateAcademicSectionScheduleAction({
      locale: "en",
      sectionId: "00000000-0000-4000-8000-000000000004",
      scheduleSlots: [{ dayOfWeek: 2, startTime: "11:00", endTime: "11:00" }],
    });

    expect(result).toEqual({ ok: false });
    expect(mockAssertAdmin).not.toHaveBeenCalled();
  });
});
