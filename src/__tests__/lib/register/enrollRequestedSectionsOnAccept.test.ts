import { describe, expect, it, vi, beforeEach } from "vitest";

const buildPreview = vi.hoisted(() => vi.fn());
const commitRpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/academics/buildSectionEnrollmentPreview", () => ({
  buildSectionEnrollmentPreview: (...args: unknown[]) => buildPreview(...args),
}));

vi.mock("@/lib/academics/commitSectionEnrollmentRpc", () => ({
  commitSectionEnrollmentRpc: (...args: unknown[]) => commitRpc(...args),
}));

import { enrollRequestedSectionsOnAccept } from "@/lib/register/enrollRequestedSectionsOnAccept";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("enrollRequestedSectionsOnAccept", () => {
  beforeEach(() => {
    buildPreview.mockReset();
    commitRpc.mockReset();
  });

  it("skips ALREADY_ACTIVE and collects capacity leftovers", async () => {
    buildPreview
      .mockResolvedValueOnce({ ok: false, code: "ALREADY_ACTIVE" })
      .mockResolvedValueOnce({ ok: true });
    commitRpc.mockResolvedValue({ ok: false, code: "CAPACITY_EXCEEDED" });

    const pending = await enrollRequestedSectionsOnAccept({} as never, "stu", [A, B]);

    expect(pending).toEqual([B]);
    expect(commitRpc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        studentId: "stu",
        sectionId: B,
        dropId: null,
        allowCapacityOverride: false,
      }),
    );
  });

  it("inserts the enrollment when the caller is the service-role client", async () => {
    buildPreview.mockResolvedValue({ ok: true });
    const inserted: Record<string, unknown>[] = [];
    const admin = {
      from: (table: string) => {
        if (table !== "section_enrollments") return {};
        return {
          insert: (row: Record<string, unknown>) => {
            inserted.push(row);
            return Promise.resolve({ error: null });
          },
        };
      },
    };
    const pending = await enrollRequestedSectionsOnAccept(admin as never, "stu", [A], {
      serviceRole: true,
    });
    expect(pending).toEqual([]);
    expect(commitRpc).not.toHaveBeenCalled();
    expect(inserted[0]).toMatchObject({
      section_id: A,
      student_id: "stu",
      status: "active",
    });
  });
});
