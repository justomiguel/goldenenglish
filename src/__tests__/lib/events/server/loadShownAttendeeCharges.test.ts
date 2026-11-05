import { describe, expect, it, vi } from "vitest";
import { loadShownAttendeeCharges } from "@/lib/events/server/loadShownAttendeeCharges";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerActionException: vi.fn(),
}));

function table(rows: unknown) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    maybeSingle: async () => ({ data: rows, error: null }),
    then: (resolve: (value: unknown) => void) => resolve({ data: rows, error: null }),
  };
  return { select: () => chain };
}

describe("loadShownAttendeeCharges", () => {
  it("replaces the gross total with the minor price and the code", async () => {
    const from = vi.fn((name: string) => {
      if (name === "events") {
        return table({
          currency: "CLP",
          price: 10000,
          price_local: null,
          price_non_local: null,
          price_by_flow: false,
          minor_ticket_price: 4000,
        });
      }
      if (name === "event_discount_code_redemptions") {
        return table([
          {
            attendee_id: "att-1",
            discount_percent: null,
            discount_amount: 1000,
            ticket_count: 2,
            event_discount_codes: { code: "FIJO" },
          },
        ]);
      }
      if (name === "event_registration_flows" || name === "event_ticket_packages") {
        return table([]);
      }
      return table([
        {
          id: "att-1",
          is_local_resident: true,
          family_discount_claimed: false,
          minor_ticket_count: 1,
          ticket_package_id: null,
          registration_flow_id: null,
          primary_attendee_id: "att-1",
          status: "pending_payment",
        },
      ]);
    });

    const shown = await loadShownAttendeeCharges({ from } as never, "evt-1", ["att-1"]);
    expect(shown.get("att-1")).toMatchObject({
      amount: 12000,
      minorTickets: 1,
      discount: { kind: "code", code: "FIJO", amountOff: 2000 },
    });
  });
});
