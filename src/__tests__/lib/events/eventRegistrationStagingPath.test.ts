import { describe, expect, it } from "vitest";
import { buildEventFormFieldStagingKey } from "@/lib/events/buildEventFormFieldStagingPath";
import {
  assertEventRegistrationStaging,
  buildEventReceiptStagingPath,
  isEventRegistrationStagingPath,
} from "@/lib/events/eventRegistrationStagingPath";

const identity = {
  eventId: "11111111-1111-1111-1111-111111111111",
  email: "Ana@Example.com",
  dniOrPassport: "12.345",
  slug: "Gala-Liora",
};

describe("event registration staging paths", () => {
  it("builds a receipt path owned by that buyer", () => {
    const path = buildEventReceiptStagingPath({
      ...identity,
      filename: "Pago.jpg",
      mime: "image/jpeg",
      now: 1,
    });
    const stagingKey = buildEventFormFieldStagingKey(identity);
    expect(path).toBe(
      `${identity.eventId}/staging/${stagingKey}/receipt/pago-1.jpg`,
    );
    expect(
      isEventRegistrationStagingPath(path, {
        eventId: identity.eventId,
        stagingKey,
        segment: "receipt",
      }),
    ).toBe(true);
  });

  it("rejects a path that leaves the buyer folder", () => {
    const stagingKey = buildEventFormFieldStagingKey(identity);
    expect(
      isEventRegistrationStagingPath(
        `${identity.eventId}/staging/${stagingKey}/receipt/../other.jpg`,
        { eventId: identity.eventId, stagingKey, segment: "receipt" },
      ),
    ).toBe(false);
  });

  it("requires a receipt path and rejects a foreign file path", () => {
    const missing = assertEventRegistrationStaging({
      ...identity,
      requireReceipt: true,
      receiptPath: "",
      filePaths: [],
    });
    expect(missing).toEqual({ ok: false, code: "receipt_required" });

    const foreign = assertEventRegistrationStaging({
      ...identity,
      requireReceipt: false,
      receiptPath: "",
      filePaths: [{ fieldId: "field-1", path: "other-event/staging/x/field-1/a.pdf" }],
    });
    expect(foreign).toEqual({ ok: false, code: "file_path_mismatch" });
  });
});
