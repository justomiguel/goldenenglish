import { describe, it, expect, vi, beforeEach } from "vitest";

const { sendNotification, setVapidDetails, fromMock } = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails,
    sendNotification,
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/push/loadVapidConfig", () => ({
  loadVapidConfig: () => ({
    publicKey: "pub",
    privateKey: "priv",
    contactEmail: "ops@example.com",
  }),
}));

import { sendPushToUser } from "@/lib/push/sendPushNotification";

describe("sendPushToUser", () => {
  beforeEach(() => {
    sendNotification.mockReset();
    setVapidDetails.mockReset();
    fromMock.mockReset();
  });

  it("sends to all subscriptions and updates last_used_at", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: updateEq }));
    fromMock.mockImplementation((table: string) => {
      if (table === "push_subscriptions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "sub-1",
                  endpoint: "https://push.example/1",
                  keys_p256dh: "p256",
                  keys_auth: "auth",
                },
              ],
              error: null,
            }),
          })),
          update,
          delete: vi.fn(),
        };
      }
      return {};
    });
    sendNotification.mockResolvedValue(undefined);

    const result = await sendPushToUser("user-1", {
      title: "Hi",
      body: "There",
      url: "/es/dashboard",
    });

    expect(result).toEqual({ sent: 1, removed: 0 });
    expect(sendNotification).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalled();
  });

  it("deletes subscriptions that return 410 Gone", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ eq: deleteEq }));
    fromMock.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: "sub-stale",
              endpoint: "https://push.example/stale",
              keys_p256dh: "p256",
              keys_auth: "auth",
            },
          ],
          error: null,
        }),
      })),
      update: vi.fn(),
      delete: del,
    }));
    sendNotification.mockRejectedValue({ statusCode: 410 });

    const result = await sendPushToUser("user-1", { title: "Hi", body: "There" });
    expect(result).toEqual({ sent: 0, removed: 1 });
    expect(del).toHaveBeenCalled();
  });
});
