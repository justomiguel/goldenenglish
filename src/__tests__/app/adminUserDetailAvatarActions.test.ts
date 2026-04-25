/** @vitest-environment jsdom */
// REGRESSION CHECK: Admin avatar changes are cross-account profile mutations;
// they must stay admin-only, student-only, size/type validated, and audited.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadAdminStudentAvatarAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import es from "@/dictionaries/es.json";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const recordSystemAudit = vi.fn();
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...a: unknown[]) => recordSystemAudit(...a),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const storageUpload = vi.fn();
const storageRemove = vi.fn();
const profilesUpdateEq = vi.fn();
const profileMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      from: (bucket: string) => {
        expect(bucket).toBe("avatars");
        return {
          upload: storageUpload,
          remove: storageRemove,
        };
      },
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: profileMaybeSingle,
            }),
          }),
          update: () => ({
            eq: profilesUpdateEq,
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

function formDataFor(file: File, targetUserId = "00000000-0000-4000-8000-000000000001") {
  const form = new FormData();
  form.set("locale", "es");
  form.set("targetUserId", targetUserId);
  form.set("avatar", file);
  return form;
}

describe("uploadAdminStudentAvatarAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({});
    profileMaybeSingle.mockResolvedValue({
      data: { role: "student", avatar_url: "00000000-0000-4000-8000-000000000001/old.jpg" },
      error: null,
    });
    storageRemove.mockResolvedValue({ error: null });
    storageUpload.mockResolvedValue({ error: null });
    profilesUpdateEq.mockResolvedValue({ error: null });
    recordSystemAudit.mockResolvedValue({ ok: true });
  });

  it("uploads a valid student avatar and audits the change", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    Object.defineProperty(file, "arrayBuffer", {
      value: vi.fn().mockResolvedValue(new TextEncoder().encode("avatar").buffer),
    });

    const result = await uploadAdminStudentAvatarAction(formDataFor(file));

    expect(result).toEqual({ ok: true, message: es.admin.users.detailAvatarSuccess });
    expect(storageRemove).toHaveBeenCalledWith(["00000000-0000-4000-8000-000000000001/old.jpg"]);
    expect(storageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^00000000-0000-4000-8000-000000000001\/.+\.png$/),
      expect.any(Buffer),
      { contentType: "image/png", upsert: false },
    );
    expect(profilesUpdateEq).toHaveBeenCalledWith("id", "00000000-0000-4000-8000-000000000001");
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin_student_avatar_update",
        resourceType: "profiles",
        resourceId: "00000000-0000-4000-8000-000000000001",
      }),
    );
  });

  it("rejects non-student targets", async () => {
    profileMaybeSingle.mockResolvedValueOnce({ data: { role: "teacher", avatar_url: null }, error: null });
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    Object.defineProperty(file, "arrayBuffer", {
      value: vi.fn().mockResolvedValue(new TextEncoder().encode("avatar").buffer),
    });

    const result = await uploadAdminStudentAvatarAction(formDataFor(file));

    expect(result).toEqual({ ok: false, message: es.admin.users.detailAvatarErrNotStudent });
    expect(storageUpload).not.toHaveBeenCalled();
    expect(profilesUpdateEq).not.toHaveBeenCalled();
  });
});
