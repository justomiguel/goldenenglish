/** @vitest-environment node */
// REGRESSION CHECK: Existing parents must keep their password; students must not become shop buyers.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGuestShopperProfile } from "@/lib/shop/guestShopperProfile";
import { ensureGuestShopperParent } from "@/lib/shop/ensureGuestShopperParent";

const NEW_ID = "11111111-1111-4111-8111-111111111111";
const PARENT_ID = "22222222-2222-4222-8222-222222222222";
const STUDENT_ID = "33333333-3333-4333-8333-333333333333";
const EMAIL = "ada.lovelace@school.cl";

function mockAdmin(opts: {
  authUserId?: string | null;
  profile?: { id: string; role: string } | null;
  createdUserId?: string;
}) {
  const listUsers = vi.fn().mockResolvedValue({
    data: {
      users: opts.authUserId ? [{ id: opts.authUserId, email: EMAIL }] : [],
    },
    error: null,
  });
  const createUser = vi.fn().mockResolvedValue({
    data: { user: { id: opts.createdUserId ?? NEW_ID } },
    error: null,
  });
  const updateUserById = vi.fn().mockResolvedValue({ data: {}, error: null });
  const maybeSingle = vi.fn().mockResolvedValue({
    data: opts.profile ?? null,
    error: null,
  });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const insert = vi.fn().mockResolvedValue({ error: null });

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
      upsert,
      insert,
    })),
    auth: { admin: { listUsers, createUser, updateUserById } },
    _mocks: { listUsers, createUser, updateUserById, maybeSingle, upsert, insert },
  };
}

describe("ensureGuestShopperParent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an auth user and parent profile when the email is new", async () => {
    const admin = mockAdmin({ authUserId: null, createdUserId: NEW_ID });

    const result = await ensureGuestShopperParent({
      email: EMAIL,
      admin: admin as never,
    });

    expect(result.kind).toBe("created");
    if (result.kind !== "created") return;
    expect(result.profileId).toBe(NEW_ID);
    expect(result.tempPassword.length).toBeGreaterThan(11);

    expect(admin._mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: EMAIL.toLowerCase(),
        email_confirm: true,
        password: result.tempPassword,
        app_metadata: { must_change_password: true },
      }),
    );

    const expected = buildGuestShopperProfile(EMAIL, NEW_ID);
    const profileWrite = admin._mocks.upsert.mock.calls[0] ?? admin._mocks.insert.mock.calls[0];
    expect(profileWrite?.[0]).toEqual(
      expect.objectContaining({
        id: NEW_ID,
        first_name: expected.first_name,
        last_name: expected.last_name,
        dni_or_passport: expected.dni_or_passport,
        role: "parent",
      }),
    );
    expect(admin._mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("reuses an existing parent and never resets their password", async () => {
    const admin = mockAdmin({
      authUserId: PARENT_ID,
      profile: { id: PARENT_ID, role: "parent" },
    });

    const result = await ensureGuestShopperParent({
      email: EMAIL,
      admin: admin as never,
    });

    expect(result).toEqual({ kind: "existing_parent", profileId: PARENT_ID });
    expect(admin._mocks.createUser).not.toHaveBeenCalled();
    expect(admin._mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("rejects a student email as wrong_role", async () => {
    const admin = mockAdmin({
      authUserId: STUDENT_ID,
      profile: { id: STUDENT_ID, role: "student" },
    });

    const result = await ensureGuestShopperParent({
      email: EMAIL,
      admin: admin as never,
    });

    expect(result).toEqual({ kind: "wrong_role" });
    expect(admin._mocks.createUser).not.toHaveBeenCalled();
    expect(admin._mocks.updateUserById).not.toHaveBeenCalled();
  });
});
