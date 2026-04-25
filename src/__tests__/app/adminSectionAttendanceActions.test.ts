/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminUpsertSectionAttendanceCellsAction } from "@/app/[locale]/dashboard/admin/academic/adminSectionAttendanceActions";

const { mockAssertAdmin, recordSystemAudit, revalidatePath, runAdminAttendanceCellsUpsert } =
  vi.hoisted(() => ({
    mockAssertAdmin: vi.fn(),
    recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
    revalidatePath: vi.fn(),
    runAdminAttendanceCellsUpsert: vi.fn(),
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

vi.mock("@/lib/academics/adminAttendanceMatrixMutations", () => ({
  runAdminAttendanceCellsUpsert,
  runAdminAttendanceColumnFill: vi.fn(),
  runAdminAttendanceColumnUndo: vi.fn(),
}));

const USER = "00000000-0000-4000-8000-000000000001";
const SEC = "00000000-0000-4000-8000-000000000002";
const ENR = "00000000-0000-4000-8000-000000000003";

function payloadFormData() {
  const formData = new FormData();
  formData.set(
    "payload",
    JSON.stringify({
      locale: "es",
      sectionId: SEC,
      cells: [{ enrollmentId: ENR, attendedOn: "2026-04-24", status: "present" }],
    }),
  );
  return formData;
}

describe("adminSectionAttendanceActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({ supabase: { from: vi.fn() }, user: { id: USER } });
    runAdminAttendanceCellsUpsert.mockResolvedValue({ ok: true });
  });

  // REGRESSION CHECK: attendance autosave runs inside the section workspace tab.
  // Revalidating that same admin page after every cell can replace the live
  // client matrix with a freshly computed empty payload while the admin is
  // editing. Only downstream student/parent consumers need invalidation here.
  it("does not revalidate the active admin section page after autosaving cells", async () => {
    const res = await adminUpsertSectionAttendanceCellsAction(null, payloadFormData());

    expect(res).toEqual({ ok: true });
    expect(runAdminAttendanceCellsUpsert).toHaveBeenCalledWith(
      expect.anything(),
      USER,
      SEC,
      [{ enrollmentId: ENR, attendedOn: "2026-04-24", status: "present" }],
    );
    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/student");
    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/parent");
    expect(revalidatePath).not.toHaveBeenCalledWith(
      expect.stringContaining(`/dashboard/admin/academic/`),
    );
  });
});
