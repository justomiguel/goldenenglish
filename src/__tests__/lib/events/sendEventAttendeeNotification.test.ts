/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { notifyAttendeeViaResend, scene } = vi.hoisted(() => ({
  notifyAttendeeViaResend: vi.fn(async () => true),
  scene: {
    kind: "full" as
      | "full"
      | "attendee-error"
      | "no-email"
      | "no-event"
      | "no-flow"
      | "no-date"
      | "blank"
      | "null-flow"
      | "throw",
  },
}));

vi.mock("@/lib/events/server/notifyAttendeeViaResend", () => ({
  notifyAttendeeViaResend: (...args: unknown[]) => notifyAttendeeViaResend(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (scene.kind === "throw") throw new Error("no admin");
    return {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (table === "event_attendees") {
                if (scene.kind === "attendee-error") return { data: null, error: { message: "db" } };
                if (scene.kind === "no-email") {
                  return { data: { email: "", event_id: "event-1" }, error: null };
                }
                if (scene.kind === "no-event") {
                  return { data: { email: "ana@example.com", event_id: null }, error: null };
                }
                return {
                  data: {
                    email: "ana@example.com",
                    first_name: scene.kind === "blank" ? null : "A<na",
                    last_name: scene.kind === "blank" ? null : "Pérez",
                    registration_locale: scene.kind === "no-flow" ? null : "en",
                    registration_flow_id: scene.kind === "no-flow" ? null : "flow-1",
                    event_id: "event-1",
                  },
                  error: null,
                };
              }
              if (table === "events") {
                if (scene.kind === "no-date") {
                  return { data: { title: null, event_date: null, location: null }, error: null };
                }
                return {
                  data: { title: "Open house", event_date: "2026-03-12T21:00:00.000Z", location: "Hall" },
                  error: null,
                };
              }
              if (scene.kind === "null-flow") return { data: { name_i18n: null }, error: null };
              return { data: { name_i18n: { en: "Academy" } }, error: null };
            },
          }),
        }),
      }),
    };
  },
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerException: vi.fn(),
}));

import { sendEventAttendeeNotification } from "@/lib/events/server/sendEventAttendeeNotification";

describe("sendEventAttendeeNotification", () => {
  beforeEach(() => {
    scene.kind = "full";
    notifyAttendeeViaResend.mockClear();
    notifyAttendeeViaResend.mockResolvedValue(true);
  });

  it("passes the attendee flow and the raw name to the mail resolver", async () => {
    const ok = await sendEventAttendeeNotification({
      attendeeId: "att-1",
      templateKey: "events.registered",
    });
    expect(ok).toBe(true);
    expect(notifyAttendeeViaResend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ana@example.com",
        templateKey: "events.registered",
        locale: "en",
        eventId: "event-1",
        flowId: "flow-1",
        vars: expect.objectContaining({ firstName: "A<na", flowName: "Academy" }),
      }),
    );
  });

  it("returns false when the attendee cannot be loaded", async () => {
    scene.kind = "attendee-error";
    await expect(
      sendEventAttendeeNotification({ attendeeId: "att-1", templateKey: "events.registered" }),
    ).resolves.toBe(false);
    scene.kind = "no-email";
    await expect(
      sendEventAttendeeNotification({ attendeeId: "att-1", templateKey: "events.registered" }),
    ).resolves.toBe(false);
    scene.kind = "no-event";
    await expect(
      sendEventAttendeeNotification({ attendeeId: "att-1", templateKey: "events.registered" }),
    ).resolves.toBe(false);
    expect(notifyAttendeeViaResend).not.toHaveBeenCalled();
  });

  it("sends without a flow and without an event date", async () => {
    scene.kind = "no-flow";
    await sendEventAttendeeNotification({ attendeeId: "att-1", templateKey: "events.reminder" });
    expect(notifyAttendeeViaResend).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "es", flowId: null, vars: expect.objectContaining({ flowName: "" }) }),
    );

    scene.kind = "no-date";
    await sendEventAttendeeNotification({ attendeeId: "att-1", templateKey: "events.reminder" });
    expect(notifyAttendeeViaResend).toHaveBeenLastCalledWith(
      expect.objectContaining({
        vars: expect.objectContaining({ eventName: "", eventDate: "", eventLocation: "" }),
      }),
    );
  });

  it("uses empty names when the profile and the flow name are missing", async () => {
    scene.kind = "blank";
    await sendEventAttendeeNotification({ attendeeId: "att-1", templateKey: "events.registered" });
    expect(notifyAttendeeViaResend).toHaveBeenCalledWith(
      expect.objectContaining({ vars: expect.objectContaining({ firstName: "", lastName: "" }) }),
    );
    scene.kind = "null-flow";
    await sendEventAttendeeNotification({ attendeeId: "att-1", templateKey: "events.registered" });
    expect(notifyAttendeeViaResend).toHaveBeenLastCalledWith(
      expect.objectContaining({ vars: expect.objectContaining({ flowName: "" }) }),
    );
  });

  it("returns false when the admin client throws", async () => {
    scene.kind = "throw";
    await expect(
      sendEventAttendeeNotification({ attendeeId: "att-1", templateKey: "events.registered" }),
    ).resolves.toBe(false);
  });
});
