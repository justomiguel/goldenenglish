/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyCronRequest, sendEventAttendeeNotification, scene } = vi.hoisted(() => ({
  verifyCronRequest: vi.fn(() => true),
  sendEventAttendeeNotification: vi.fn(async () => true),
  scene: {
    attendees: [{ id: "att-1", email: "ana@example.com", event_id: "event-1" }] as
      | Array<{ id: string }>
      | null,
    explode: false,
  },
}));

vi.mock("@/lib/auth/verifyCronRequest", () => ({
  verifyCronRequest: () => verifyCronRequest(),
}));

vi.mock("@/lib/events/server/sendEventAttendeeNotification", () => ({
  sendEventAttendeeNotification: (...args: unknown[]) => sendEventAttendeeNotification(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (scene.explode) throw new Error("no admin");
    const builder = {
      select() {
        return builder;
      },
      in() {
        return builder;
      },
      gte() {
        return builder;
      },
      lte() {
        return builder;
      },
      limit: async () => ({ data: scene.attendees }),
    };
    return { from: () => builder };
  },
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
}));

import { GET } from "@/app/api/cron/event-reminders/route";

describe("event reminder cron", () => {
  beforeEach(() => {
    scene.attendees = [{ id: "att-1", email: "ana@example.com", event_id: "event-1" }];
    scene.explode = false;
    verifyCronRequest.mockReturnValue(true);
    sendEventAttendeeNotification.mockReset();
    sendEventAttendeeNotification.mockResolvedValue(true);
  });

  it("sends the reminder for each attendee in the window", async () => {
    const response = await GET(new Request("http://localhost/api/cron/event-reminders"));
    expect(response.status).toBe(200);
    expect(sendEventAttendeeNotification).toHaveBeenCalledWith({
      attendeeId: "att-1",
      templateKey: "events.reminder",
    });
  });

  it("rejects a request without the cron header", async () => {
    verifyCronRequest.mockReturnValue(false);
    const response = await GET(new Request("http://localhost/api/cron/event-reminders"));
    expect(response.status).toBe(401);
    expect(sendEventAttendeeNotification).not.toHaveBeenCalled();
  });

  it("counts only the reminders that were sent", async () => {
    sendEventAttendeeNotification.mockResolvedValue(false);
    const response = await GET(new Request("http://localhost/api/cron/event-reminders"));
    await expect(response.json()).resolves.toEqual({ ok: true, sent: 0, total: 1 });
  });

  it("reports an empty window when there are no attendees", async () => {
    scene.attendees = null;
    const response = await GET(new Request("http://localhost/api/cron/event-reminders"));
    await expect(response.json()).resolves.toEqual({ ok: true, sent: 0, total: 0 });
  });

  it("returns 500 when the query throws", async () => {
    scene.explode = true;
    const response = await GET(new Request("http://localhost/api/cron/event-reminders"));
    expect(response.status).toBe(500);
  });
});
