// REGRESSION CHECK: A Resend usage body must yield monthly used and limit.
// A tenant with no key shows the Pulsar allowance. A failed usage call stays unread.
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RESEND_USAGE_URL,
  fetchResendMonthlyMail,
  loadFleetMailMonth,
  mailMonthFromTenant,
  readResendMonthlyMail,
} from "@/lib/email/resendMonthlyMail";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: vi.fn(),
  logServerError: vi.fn(),
}));

const usageBody = {
  object: "usage",
  emails: { monthly: { used: 80, limit: 3000, sent: 70, received: 10 } },
};

describe("resendMonthlyMail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads monthly used and limit", () => {
    expect(readResendMonthlyMail(usageBody)).toEqual({ used: 80, limit: 3000 });
    expect(readResendMonthlyMail({ emails: { monthly: { used: 2, limit: null } } })).toEqual({
      used: 2,
      limit: null,
    });
    expect(readResendMonthlyMail({})).toBeNull();
  });

  it("uses the Pulsar allowance when the institute has no Resend key", () => {
    expect(
      mailMonthFromTenant({
        resendApiKey: null,
        usage: null,
        pulsarMailSent: 12,
        pulsarMailQuota: 50,
      }),
    ).toEqual({ source: "pulsar", used: 12, limit: 50 });
  });

  it("stays unread when the key cannot report usage", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    await expect(fetchResendMonthlyMail("re_send_only", fetchImpl)).resolves.toEqual("unread");
    expect(fetchImpl).toHaveBeenCalledWith(
      RESEND_USAGE_URL,
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer re_send_only", Accept: "application/json" },
      }),
    );
  });

  it("loads one usage call per distinct key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => usageBody,
    });
    const map = await loadFleetMailMonth(
      [
        { slug: "nago", resendApiKey: "re_same" },
        { slug: "golden", resendApiKey: "re_same" },
        { slug: "free", resendApiKey: null, pulsarMailSent: 3, pulsarMailQuota: 50 },
      ],
      fetchImpl,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(map.nago).toEqual({ source: "resend", used: 80, limit: 3000 });
    expect(map.golden).toEqual({ source: "resend", used: 80, limit: 3000 });
    expect(map.free).toEqual({ source: "pulsar", used: 3, limit: 50 });
  });
});
