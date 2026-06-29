import { describe, expect, it } from "vitest";
import {
  buildEventAttendeeReference,
  parseEventGatewayReference,
} from "@/lib/events/parseEventGatewayReference";

describe("buildEventAttendeeReference", () => {
  it("prefixes the attendee id", () => {
    expect(buildEventAttendeeReference("att-1")).toBe("event_attendee:att-1");
  });
});

describe("parseEventGatewayReference", () => {
  it("parses an attendee reference", () => {
    expect(parseEventGatewayReference("event_attendee:att-1")).toEqual({
      kind: "attendee",
      attendeeId: "att-1",
    });
  });

  it("parses an attendee reference with a retry suffix (Flow commerceOrder)", () => {
    expect(parseEventGatewayReference("event_attendee:att-1:lk9z2")).toEqual({
      kind: "attendee",
      attendeeId: "att-1",
    });
  });

  it("parses a legacy payment reference", () => {
    expect(parseEventGatewayReference("event_payment:pay-9")).toEqual({
      kind: "payment",
      paymentId: "pay-9",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseEventGatewayReference("  event_attendee:att-2  ")).toEqual({
      kind: "attendee",
      attendeeId: "att-2",
    });
  });

  it.each([null, undefined, "", "garbage", "event_attendee:", "event_payment:"])(
    "returns null for invalid input %p",
    (value) => {
      expect(parseEventGatewayReference(value)).toBeNull();
    },
  );
});
