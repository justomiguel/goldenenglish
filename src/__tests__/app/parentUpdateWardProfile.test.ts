/**
 * REGRESSION CHECK — Account Takeover via parent → ward email change.
 *
 * Pre-existing bug: a parent could reassign the student's login email and
 * confirm it in one step, with no re-auth, no notification, no audit. From a
 * compromised parent session this is full account takeover (OWASP A04 + A07).
 *
 * Hardened contract this suite pins (kept here to fail loudly if any of the
 * three controls regress):
 *   - email change requires re-authenticating the parent (parentPassword)
 *   - email change notifies BOTH the previous and the new email
 *   - email change inserts an audit row in `system_config_audit`
 *   - editing only non-email fields requires NO password (no extra friction)
 */

/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const verifyUserPasswordMock = vi.fn();
vi.mock("@/lib/supabase/verifyUserPassword", () => ({
  verifyUserPassword: (...a: unknown[]) => verifyUserPasswordMock(...a),
}));

const sendBrandedEmailMock = vi.fn();
vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail: (...a: unknown[]) => sendBrandedEmailMock(...a),
}));

const getBrandForRequestMock = vi.fn();
vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: () => getBrandForRequestMock(),
}));

const auditIdentityActionMock = vi.fn();
vi.mock("@/lib/audit", () => ({
  auditIdentityAction: (...a: unknown[]) => auditIdentityActionMock(...a),
}));

// --- Supabase user-scoped client (createClient) ---
const userGetUserMock = vi.fn();
const profilesByIdMock = vi.fn();
const tutorLinkMock = vi.fn();
const profilesUpdateEqMock = vi.fn();
/** Captures the patch so the care-note suite can inspect what gets written. */
const profilesUpdatePatchMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: () => userGetUserMock() },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => profilesByIdMock(),
            }),
          }),
          update: (patch: unknown) => {
            profilesUpdatePatchMock(patch);
            return { eq: profilesUpdateEqMock };
          },
        };
      }
      if (table === "tutor_student_rel") {
        return {
          select: () => ({
            eq: () => ({ eq: () => ({ maybeSingle: () => tutorLinkMock() }) }),
          }),
        };
      }
      throw new Error(`unexpected user table ${table}`);
    },
  }),
}));

// --- Supabase admin client (createAdminClient) ---
const adminGetUserByIdMock = vi.fn();
const adminUpdateUserByIdMock = vi.fn();
const auditInsertMock = vi.fn();
const adminProfileSelectMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: (...a: unknown[]) => adminGetUserByIdMock(...a),
        updateUserById: (...a: unknown[]) => adminUpdateUserByIdMock(...a),
      },
    },
    from: (table: string) => {
      if (table === "system_config_audit") {
        return { insert: (row: unknown) => auditInsertMock(row) };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            in: () => ({ then: undefined }),
            eq: () => ({ maybeSingle: () => adminProfileSelectMock() }),
          }),
        };
      }
      throw new Error(`unexpected admin table ${table}`);
    },
  }),
}));

const STUDENT_ID = "00000000-0000-4000-8000-000000000001";
const PARENT_ID = "00000000-0000-4000-8000-000000000002";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    locale: "es",
    studentId: STUDENT_ID,
    first_name: "Juan",
    last_name: "Perez",
    phone: "+5491100000000",
    birth_date: "2010-05-01",
    email: "ward@example.com",
    ...overrides,
  };
}

describe("updateWardProfile — email-change hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    userGetUserMock.mockResolvedValue({
      data: { user: { id: PARENT_ID, email: "parent@example.com" } },
    });
    profilesByIdMock.mockResolvedValue({
      data: { role: "parent", first_name: "Maria", last_name: "Perez" },
    });
    tutorLinkMock.mockResolvedValue({ data: { student_id: STUDENT_ID } });
    profilesUpdateEqMock.mockResolvedValue({ error: null });
    adminGetUserByIdMock.mockResolvedValue({
      data: { user: { email: "old@example.com" } },
      error: null,
    });
    adminUpdateUserByIdMock.mockResolvedValue({ error: null });
    auditInsertMock.mockResolvedValue({ error: null });
    adminProfileSelectMock.mockResolvedValue({
      data: { first_name: "Juan", last_name: "Perez" },
    });
    verifyUserPasswordMock.mockResolvedValue(true);
    sendBrandedEmailMock.mockResolvedValue({ ok: true, fromOverride: false });
    getBrandForRequestMock.mockResolvedValue({ name: "Golden English", contactEmail: "soporte@example.com" });
  });

  it("rejects when parentPassword is missing AND email is changing", async () => {
    const { updateWardProfile } = await import(
      "@/app/[locale]/dashboard/parent/child/edit/actions"
    );
    const r = await updateWardProfile(baseInput({ email: "new@example.com" }));
    expect(r.ok).toBe(false);
    expect(r.message).toBe(es.dashboard.parent.wardPasswordRequired);
    expect(adminUpdateUserByIdMock).not.toHaveBeenCalled();
    expect(auditInsertMock).not.toHaveBeenCalled();
    expect(sendBrandedEmailMock).not.toHaveBeenCalled();
  });

  it("rejects when parentPassword is wrong AND email is changing", async () => {
    verifyUserPasswordMock.mockResolvedValue(false);
    const { updateWardProfile } = await import(
      "@/app/[locale]/dashboard/parent/child/edit/actions"
    );
    const r = await updateWardProfile(
      baseInput({ email: "new@example.com", parentPassword: "wrong-secret" }),
    );
    expect(r.ok).toBe(false);
    expect(r.message).toBe(es.dashboard.parent.wardPasswordInvalid);
    expect(adminUpdateUserByIdMock).not.toHaveBeenCalled();
    expect(auditInsertMock).not.toHaveBeenCalled();
    expect(sendBrandedEmailMock).not.toHaveBeenCalled();
  });

  it("does NOT require password if email is unchanged", async () => {
    adminGetUserByIdMock.mockResolvedValue({
      data: { user: { email: "ward@example.com" } },
      error: null,
    });
    const { updateWardProfile } = await import(
      "@/app/[locale]/dashboard/parent/child/edit/actions"
    );
    const r = await updateWardProfile(baseInput({ email: "  WARD@Example.com " }));
    expect(r.ok).toBe(true);
    expect(verifyUserPasswordMock).not.toHaveBeenCalled();
    expect(adminUpdateUserByIdMock).not.toHaveBeenCalled();
    expect(auditInsertMock).not.toHaveBeenCalled();
    expect(sendBrandedEmailMock).not.toHaveBeenCalled();
  });

  it("on email change: re-auths, updates auth, audits, notifies BOTH old and new email", async () => {
    const { updateWardProfile } = await import(
      "@/app/[locale]/dashboard/parent/child/edit/actions"
    );
    const r = await updateWardProfile(
      baseInput({ email: "new@example.com", parentPassword: "right-secret" }),
    );
    expect(r.ok).toBe(true);

    expect(verifyUserPasswordMock).toHaveBeenCalledWith("parent@example.com", "right-secret");
    expect(adminUpdateUserByIdMock).toHaveBeenCalledWith(
      STUDENT_ID,
      expect.objectContaining({ email: "new@example.com", email_confirm: true }),
    );

    // Audit + notify run fire-and-forget after the action returns.
    await vi.waitFor(() => {
      expect(auditInsertMock).toHaveBeenCalledTimes(1);
    });
    const auditRow = auditInsertMock.mock.calls[0][0];
    expect(auditRow).toMatchObject({
      actor_id: PARENT_ID,
      action: "parent.ward.email_changed",
      resource_type: "auth.user.email",
      resource_id: STUDENT_ID,
    });
    expect(auditRow.payload).toMatchObject({
      old_email: "old@example.com",
      new_email: "new@example.com",
      parent_email: "parent@example.com",
    });

    await vi.waitFor(() => {
      expect(sendBrandedEmailMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
    const recipients = sendBrandedEmailMock.mock.calls.map((c) => c[0].to);
    expect(recipients).toEqual(expect.arrayContaining(["old@example.com", "new@example.com"]));
    for (const call of sendBrandedEmailMock.mock.calls) {
      expect(call[0].templateKey).toBe("notifications.ward_email_changed");
    }
  });
});

describe("updateWardProfile — care notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    userGetUserMock.mockResolvedValue({
      data: { user: { id: PARENT_ID, email: "parent@example.com" } },
    });
    profilesByIdMock.mockResolvedValue({
      data: { role: "parent", first_name: "Maria", last_name: "Perez" },
    });
    tutorLinkMock.mockResolvedValue({ data: { student_id: STUDENT_ID } });
    profilesUpdateEqMock.mockResolvedValue({ error: null });
    // Same email, so the whole re-auth branch stays out of the way.
    adminGetUserByIdMock.mockResolvedValue({
      data: { user: { email: "ward@example.com" } },
      error: null,
    });
    getBrandForRequestMock.mockResolvedValue({ name: "Golden English", contactEmail: "s@e.com" });
  });

  async function save(overrides: Record<string, unknown> = {}) {
    const { updateWardProfile } = await import(
      "@/app/[locale]/dashboard/parent/child/edit/actions"
    );
    return updateWardProfile(baseInput(overrides));
  }

  it("lets a tutor record care notes for their own ward", async () => {
    const r = await save({
      care_health_note: "  Asma leve  ",
      care_diet_note: "Sin gluten",
      care_support_note: "",
    });

    expect(r.ok).toBe(true);
    const patch = profilesUpdatePatchMock.mock.calls[0][0];
    expect(patch.care_health_note).toBe("Asma leve");
    expect(patch.care_diet_note).toBe("Sin gluten");
    expect(patch.care_support_note).toBeNull();
    expect(patch.care_updated_by).toBe(PARENT_ID);
    expect(typeof patch.care_updated_at).toBe("string");
  });

  it("leaves the care columns alone when the form does not send them", async () => {
    // The ward form is also used by flows that never show the care fields;
    // absent must mean "unchanged", not "cleared".
    await save();

    const patch = profilesUpdatePatchMock.mock.calls[0][0];
    expect(patch).not.toHaveProperty("care_health_note");
    expect(patch).not.toHaveProperty("care_updated_at");
  });

  it("refuses a parent who is not this student's tutor", async () => {
    tutorLinkMock.mockResolvedValue({ data: null });

    const r = await save({ care_health_note: "Asma leve" });

    expect(r.ok).toBe(false);
    expect(r.message).toBe(es.dashboard.parent.wardForbidden);
    expect(profilesUpdatePatchMock).not.toHaveBeenCalled();
  });

  it("audits that care changed without recording what it says", async () => {
    await save({ care_health_note: "Asma leve", care_diet_note: "Sin gluten" });

    await vi.waitFor(() => expect(auditIdentityActionMock).toHaveBeenCalledTimes(1));
    const entry = auditIdentityActionMock.mock.calls[0][0];
    expect(entry).toMatchObject({
      actorId: PARENT_ID,
      actorRole: "parent",
      action: "update",
      resourceType: "profile",
      resourceId: STUDENT_ID,
    });

    const serialized = JSON.stringify(auditIdentityActionMock.mock.calls);
    expect(serialized).not.toContain("Asma");
    expect(serialized).not.toContain("gluten");
  });

  it("does not audit when the parent only edited name or phone", async () => {
    await save();
    expect(auditIdentityActionMock).not.toHaveBeenCalled();
  });

  it("rejects a note past the length limit", async () => {
    const r = await save({ care_health_note: "x".repeat(2001) });

    expect(r.ok).toBe(false);
    expect(profilesUpdatePatchMock).not.toHaveBeenCalled();
  });
});
