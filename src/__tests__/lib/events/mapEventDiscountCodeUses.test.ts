import { describe, expect, it } from "vitest";
import {
  EVENT_DISCOUNT_CODE_USE_CAP,
  mapEventDiscountCodeUses,
} from "@/lib/events/mapEventDiscountCodeUses";

describe("mapEventDiscountCodeUses", () => {
  it("lists a reserved use and a released use with payment status", () => {
    const result = mapEventDiscountCodeUses([
      {
        id: "use-1",
        code_id: "code-1",
        status: "reserved",
        event_attendees: {
          first_name: "Ana",
          last_name: "Pérez",
          email: "ana@example.com",
          event_payments: { status: "pending" },
        },
      },
      {
        id: "use-2",
        code_id: "code-1",
        status: "released",
        event_attendees: [
          {
            first_name: "Luis",
            last_name: "Gómez",
            email: "luis@example.com",
            event_payments: [{ status: "rejected" }],
          },
        ],
      },
    ]);

    expect(result.truncated).toBe(false);
    expect(result.uses).toEqual([
      {
        id: "use-1",
        codeId: "code-1",
        attendeeName: "Pérez Ana",
        email: "ana@example.com",
        useStatus: "reserved",
        paymentStatus: "pending",
      },
      {
        id: "use-2",
        codeId: "code-1",
        attendeeName: "Gómez Luis",
        email: "luis@example.com",
        useStatus: "released",
        paymentStatus: "rejected",
      },
    ]);
  });

  it("marks a missing payment as no payment", () => {
    const result = mapEventDiscountCodeUses([
      {
        id: "use-1",
        code_id: "code-1",
        status: "consumed",
        event_attendees: {
          first_name: "Ana",
          last_name: "Pérez",
          email: "ana@example.com",
          event_payments: null,
        },
      },
    ]);
    expect(result.uses[0]?.paymentStatus).toBeNull();
  });

  it("flags the list when the cap is full", () => {
    const rows = Array.from({ length: EVENT_DISCOUNT_CODE_USE_CAP }, (_, index) => ({
      id: `use-${index}`,
      code_id: "code-1",
      status: "reserved",
      event_attendees: { first_name: "Ana", last_name: "Pérez", email: "ana@example.com" },
    }));
    expect(mapEventDiscountCodeUses(rows).truncated).toBe(true);
    expect(mapEventDiscountCodeUses(rows).uses).toHaveLength(EVENT_DISCOUNT_CODE_USE_CAP);
  });
});
