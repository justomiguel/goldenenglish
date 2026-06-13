import { describe, it, expect } from "vitest";
import { parsePushNotificationPayload } from "@/lib/push/pushNotificationPayload";

describe("parsePushNotificationPayload", () => {
  it("parses JSON object payloads", () => {
    expect(
      parsePushNotificationPayload({
        title: "Hello",
        body: "World",
        url: "/es/dashboard",
      }),
    ).toEqual({
      title: "Hello",
      body: "World",
      url: "/es/dashboard",
      icon: undefined,
      badge: undefined,
    });
  });

  it("parses JSON string payloads", () => {
    expect(
      parsePushNotificationPayload(JSON.stringify({ title: "Ping", body: "Pong" })),
    ).toEqual({
      title: "Ping",
      body: "Pong",
      url: undefined,
      icon: undefined,
      badge: undefined,
    });
  });

  it("returns null when title missing", () => {
    expect(parsePushNotificationPayload({ body: "only body" })).toBeNull();
  });
});
