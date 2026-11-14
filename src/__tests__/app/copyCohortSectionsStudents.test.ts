// REGRESSION CHECK: copying students into a new cohort does not drop the source enrollment.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { copyCohortSectionStructureAction } from "@/app/[locale]/dashboard/admin/academic/copyCohortSectionsActions";

const SRC = "00000000-0000-4000-8000-000000000001";
const TGT = "00000000-0000-4000-8000-000000000002";
const SRC_SECTION = "00000000-0000-4000-8000-000000000003";
const NEW_SECTION = "00000000-0000-4000-8000-000000000004";
const STUDENT = "00000000-0000-4000-8000-000000000005";
const TEACHER = "00000000-0000-4000-8000-000000000006";

const commitRpc = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces: vi.fn(),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit: vi.fn() }));
vi.mock("@/lib/logging/serverActionLog", () => ({ logServerException: vi.fn() }));
vi.mock("@/lib/academics/commitSectionEnrollmentRpc", () => ({
  commitSectionEnrollmentRpc: (...args: unknown[]) => commitRpc(...args),
}));
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: async () => ({ supabase: { from } }),
}));

let sectionSelects = 0;

function resultFor(table: string, op: string): { data: unknown; error: null } {
  if (table === "academic_cohorts") return { data: { id: table, archived_at: null }, error: null };
  if (table === "academic_sections" && op === "insert") return { data: { id: NEW_SECTION }, error: null };
  if (table === "academic_sections") {
    sectionSelects += 1;
    if (sectionSelects === 1) {
      return {
        data: [
          {
            id: SRC_SECTION,
            name: "A",
            teacher_id: TEACHER,
            schedule_slots: [],
            max_students: 12,
            starts_on: null,
            ends_on: null,
          },
        ],
        error: null,
      };
    }
    return { data: [], error: null };
  }
  if (table === "section_enrollments") {
    return { data: [{ id: "enr", student_id: STUDENT }], error: null };
  }
  return { data: [], error: null };
}

function from(table: string) {
  let op = "select";
  const builder: Record<string, unknown> = {};
  const finish = () => Promise.resolve(resultFor(table, op));
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  builder.is = chain;
  builder.order = chain;
  builder.insert = () => {
    op = "insert";
    return builder;
  };
  builder.single = finish;
  builder.maybeSingle = finish;
  builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    finish().then(resolve, reject);
  return builder;
}

describe("copyCohortSectionStructureAction students", () => {
  beforeEach(() => {
    sectionSelects = 0;
    commitRpc.mockReset();
    commitRpc.mockResolvedValue({ ok: true });
  });

  it("enrolls the student in the new section and leaves the source enrollment active", async () => {
    const result = await copyCohortSectionStructureAction({
      locale: "es",
      sourceCohortId: SRC,
      targetCohortId: TGT,
      includeStudents: true,
    });

    expect(result).toMatchObject({ ok: true, enrollmentsCopied: 1, enrollmentsFailed: 0 });
    expect(commitRpc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        studentId: STUDENT,
        sectionId: NEW_SECTION,
        dropId: null,
      }),
    );
  });
});
