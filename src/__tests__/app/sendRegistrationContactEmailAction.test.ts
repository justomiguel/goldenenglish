/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendRegistrationContactEmailAction } from "@/app/[locale]/dashboard/admin/registrations/sendRegistrationContactEmailAction";

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";

const sendWrapped = vi.hoisted(() => vi.fn());
vi.mock("@/lib/email/templates/sendWrappedHtmlEmail", () => ({
  sendWrappedHtmlEmail: (...args: unknown[]) => sendWrapped(...args),
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: async () => ({ name: "North Institute" }),
}));

const assertAdmin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => assertAdmin(),
}));

const from = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: async () => ({ from: (...args: unknown[]) => from(...args) }),
}));

function mockLead(row: { email: string | null; tutor_email: string | null } | null) {
  from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: row ? { id: REG_ID, ...row } : null, error: null }),
      }),
    }),
  });
}

describe("sendRegistrationContactEmailAction", () => {
  beforeEach(() => {
    assertAdmin.mockResolvedValue({ user: { id: "actor-1" } });
    sendWrapped.mockReset();
    sendWrapped.mockResolvedValue({ ok: true });
    from.mockReset();
  });

  it("sends the institute mail to the tutor address", async () => {
    mockLead({ email: "student@example.com", tutor_email: "tutor@example.com" });
    const result = await sendRegistrationContactEmailAction({
      locale: "es",
      registrationId: REG_ID,
      bodyHtml: "<p>Hola</p>",
    });
    expect(result).toEqual({ ok: true });
    expect(sendWrapped).toHaveBeenCalledWith(
      expect.objectContaining({ to: "tutor@example.com", bodyHtml: "<p>Hola</p>" }),
    );
  });

  it("returns empty_message when the body has no text", async () => {
    mockLead({ email: "student@example.com", tutor_email: null });
    const result = await sendRegistrationContactEmailAction({
      locale: "es",
      registrationId: REG_ID,
      bodyHtml: "<p></p>",
    });
    expect(result).toEqual({ ok: false, code: "empty_message" });
    expect(sendWrapped).not.toHaveBeenCalled();
  });

  it("returns missing_registration_email when the lead has no address", async () => {
    mockLead({ email: null, tutor_email: "  " });
    const result = await sendRegistrationContactEmailAction({
      locale: "es",
      registrationId: REG_ID,
      bodyHtml: "<p>Hola</p>",
    });
    expect(result).toEqual({ ok: false, code: "missing_registration_email" });
    expect(sendWrapped).not.toHaveBeenCalled();
  });
});
