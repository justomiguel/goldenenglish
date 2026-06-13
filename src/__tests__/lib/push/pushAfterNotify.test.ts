import { describe, expect, it, vi, beforeEach } from "vitest";

const sendPushToUser = vi.fn();
const logServerException = vi.fn();

vi.mock("@/lib/push/sendPushNotification", () => ({
  sendPushToUser: (...args: unknown[]) => sendPushToUser(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: (...args: unknown[]) => logServerException(...args),
}));

import { pushAfterNotify } from "@/lib/push/pushAfterNotify";

describe("pushAfterNotify", () => {
  beforeEach(() => {
    sendPushToUser.mockReset();
    logServerException.mockReset();
  });

  it("delegates to sendPushToUser", async () => {
    sendPushToUser.mockResolvedValue({ sent: 1, removed: 0 });
    await pushAfterNotify("user-1", { title: "T", body: "B" }, "messaging.send");
    expect(sendPushToUser).toHaveBeenCalledWith("user-1", { title: "T", body: "B" });
  });

  it("logs and swallows errors", async () => {
    sendPushToUser.mockRejectedValue(new Error("boom"));
    await pushAfterNotify("user-2", { title: "T", body: "B" }, "billing.notify");
    expect(logServerException).toHaveBeenCalled();
  });
});
