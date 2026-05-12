// REGRESSION CHECK: Parent/tutor Auth password must stay aligned with admin invite default (not DNI-derived).
// REGRESSION CHECK: Failed Auth signup must classify error (not lump all tutor failures as duplicate email UX).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAuthAdminCreateUserFailure, logServerWarn } from "@/lib/logging/serverActionLog";
import { ensureParentProfileByTutorDni } from "@/lib/register/ensureParentProfileByTutorDni";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/dashboard/adminInviteDefaultPassword";

vi.mock("@/lib/server/createIncidentSupportRef", () => ({
  createIncidentSupportRef: vi.fn(() => "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee"),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logAuthAdminCreateUserFailure: vi.fn(),
  logServerWarn: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

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

  it("maps duplicate email signup errors for tutor provisioning when Auth user cannot be found", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });
    const listUsers = vi.fn().mockResolvedValue({
      data: { users: [] },
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle }),
        }),
      }),
      auth: { admin: { createUser, listUsers } },
    };

    const r = await ensureParentProfileByTutorDni(admin as never, {
      tutorDniRaw: "12.345.678",
      tutorEmail: "t@test.com",
      tutorPhone: null,
      tutorFirstName: "Ana",
      tutorLastName: "Lopez",
    });

    expect(r).toEqual({ ok: false, message: "tutor_auth_email_exists" });
    expect(logAuthAdminCreateUserFailure).toHaveBeenCalledWith(
      "ensureParentProfileByTutorDni:authAdminCreateUser",
      expect.any(Object),
      expect.objectContaining({
        classified_issue: "email_exists",
        signup_attempt_subject: "guardian_parent_new_auth_user",
        tutor_email_provided_explicitly: true,
        collision_attempt_email_normalized: "t@test.com",
        collision_email_domain_suffix: "test.com",
      }),
    );
  });

  it("returns tutor_auth_unexpected with incident ref for correlated logging", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "upstream failure", code: "x" },
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
      tutorDniRaw: "12.345.678",
      tutorEmail: "t@test.com",
      tutorPhone: null,
      tutorFirstName: "Ana",
      tutorLastName: "Lopez",
    });

    expect(r).toEqual({
      ok: false,
      message: "tutor_auth_unexpected",
      incidentRef: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
    });
  });

  it("provisions portal profile when login exists but profiles row was missing", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered", code: "email_exists", status: 422 },
    });
    const listUsers = vi.fn().mockResolvedValue({
      data: {
        users: [{ id: "orphan-auth-uuid", email: "ghost@test.com" }],
      },
      error: null,
    });
    const updateUserById = vi.fn().mockResolvedValue({ data: {}, error: null });
    const maybeSingleDni = vi.fn().mockResolvedValue({ data: null, error: null });
    const maybeSingleId = vi.fn().mockResolvedValue({ data: null, error: null });
    const profilesUpsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      expect(table).toBe("profiles");
      return {
        select: vi.fn(() => ({
          eq: vi.fn((column: string) => ({
            maybeSingle: column === "dni_or_passport" ? maybeSingleDni : maybeSingleId,
          })),
        })),
        upsert: profilesUpsert,
      };
    });

    const admin = {
      from,
      auth: { admin: { createUser, listUsers, updateUserById } },
    };

    const r = await ensureParentProfileByTutorDni(admin as never, {
      tutorDniRaw: "12.345.678",
      tutorEmail: "ghost@test.com",
      tutorPhone: null,
      tutorFirstName: "Ana",
      tutorLastName: "Lopez",
    });

    expect(r).toEqual({
      ok: true,
      parentId: "orphan-auth-uuid",
      reuseKind: "provisioned_prior_auth",
    });
    expect(updateUserById).toHaveBeenCalledWith(
      "orphan-auth-uuid",
      expect.objectContaining({
        password: ADMIN_INVITE_DEFAULT_PASSWORD,
      }),
    );
    expect(profilesUpsert).toHaveBeenCalled();
    expect(logServerWarn).toHaveBeenCalledWith(
      "ensureParentProfileByTutorDni:provisionedPriorAuthRepair",
      expect.objectContaining({
        parentId: "orphan-auth-uuid",
        signup_attempt_subject: "guardian_parent_new_auth_user",
      }),
    );
  });
});
