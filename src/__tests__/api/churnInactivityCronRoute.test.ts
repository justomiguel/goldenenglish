/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyCronRequest, createAdminClient, loadEmailSendGate, sendStudentChurnAlert } = vi.hoisted(
  () => ({
    verifyCronRequest: vi.fn(),
    createAdminClient: vi.fn(),
    loadEmailSendGate: vi.fn(),
    sendStudentChurnAlert: vi.fn(),
  }),
);

vi.mock("@/lib/auth/verifyCronRequest", () => ({ verifyCronRequest }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/lib/email/loadEmailSendGate", () => ({ loadEmailSendGate }));
vi.mock("@/lib/email/churnInactivityEmail", () => ({ sendStudentChurnAlert }));

describe("GET /api/cron/churn-inactivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyCronRequest.mockReturnValue(true);
  });

  it("returns 401 without cron auth", async () => {
    verifyCronRequest.mockReturnValue(false);
    const { GET } = await import("@/app/api/cron/churn-inactivity/route");
    const res = await GET(new Request("http://localhost/api/cron/churn-inactivity"));
    expect(res.status).toBe(401);
  });

  it("returns notified 0 and does not query profiles when churn email is off", async () => {
    const from = vi.fn();
    createAdminClient.mockReturnValue({ from });
    loadEmailSendGate.mockResolvedValue({
      map: { "churn.inactivity": false },
      classRemindersEnabled: true,
    });
    const { GET } = await import("@/app/api/cron/churn-inactivity/route");
    const res = await GET(new Request("http://localhost/api/cron/churn-inactivity"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, notified: 0 });
    expect(from).not.toHaveBeenCalled();
    expect(sendStudentChurnAlert).not.toHaveBeenCalled();
  });
});
