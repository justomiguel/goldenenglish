// REGRESSION CHECK: Parent/tutor Auth password must stay aligned with admin invite default (not DNI-derived).
import { describe, it, expect, vi } from "vitest";
import { ensureParentProfileByTutorDni } from "@/lib/register/ensureParentProfileByTutorDni";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/dashboard/adminInviteDefaultPassword";

describe("ensureParentProfileByTutorDni", () => {
  it("creates a new parent with ADMIN_INVITE_DEFAULT_PASSWORD", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "new-parent-uuid" } },
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle }),
        }),
      }),
      auth: { admin: { createUser } },
    };

    const r = await ensureParentProfileByTutorDni(admin as never, {
      tutorDniRaw: " 12.345.678 ",
      tutorEmail: null,
      tutorPhone: null,
      tutorFirstName: "Ana",
      tutorLastName: "Lopez",
    });

    expect(r).toEqual({ ok: true, parentId: "new-parent-uuid", reuseKind: "created" });
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        password: ADMIN_INVITE_DEFAULT_PASSWORD,
      }),
    );
  });
});
