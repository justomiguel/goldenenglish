import { describe, expect, it } from "vitest";
import { resolveRegistrationFlowView, registrationFlowCharge } from "@/lib/events/registrationFlows";

const extras = [
  { id: "shared-1", position: 0, flowId: null },
  { id: "academy", position: 1, flowId: "flow-a" },
  { id: "cup", position: 2, flowId: "flow-b" },
];

describe("resolveRegistrationFlowView", () => {
  it("shows every extra when the event has no flows", () => {
    const view = resolveRegistrationFlowView({
      flows: [],
      extras: extras.map((extra) => ({ ...extra, flowId: "flow-a" })),
      sharedOrder: [],
      collectBirthDate: false,
    });
    expect(view.askFlow).toBe(false);
    expect(view.flowId).toBeNull();
    expect(view.questionOrder).toContain("field:academy");
    expect(view.questionOrder).toContain("field:cup");
  });

  it("appends the only flow and does not ask", () => {
    const view = resolveRegistrationFlowView({
      flows: [{ id: "flow-a", position: 0, price: null, fieldOrder: ["field:academy"] }],
      extras,
      sharedOrder: [],
      collectBirthDate: false,
    });
    expect(view.askFlow).toBe(false);
    expect(view.flowId).toBe("flow-a");
    expect(view.questionOrder.at(-1)).toBe("field:academy");
    expect(view.questionOrder).not.toContain("field:cup");
  });

  it("hides the other flow until that path is chosen", () => {
    const flows = [
      { id: "flow-a", position: 0, price: 1000, fieldOrder: ["field:academy"] },
      { id: "flow-b", position: 1, price: 500, fieldOrder: ["field:cup"] },
    ];
    const waiting = resolveRegistrationFlowView({
      flows,
      extras,
      sharedOrder: [],
      collectBirthDate: false,
    });
    expect(waiting.askFlow).toBe(true);
    expect(waiting.questionOrder).toContain("field:shared-1");
    expect(waiting.questionOrder).not.toContain("field:cup");

    const chosen = resolveRegistrationFlowView({
      flows,
      extras,
      sharedOrder: [],
      selectedFlowId: "flow-b",
      collectBirthDate: false,
    });
    expect(chosen.flowId).toBe("flow-b");
    expect(chosen.questionOrder).toContain("field:cup");
    expect(chosen.questionOrder).not.toContain("field:academy");
  });
});

describe("registrationFlowCharge", () => {
  it("confirms a free flow and asks for payment when the flow has a price", () => {
    expect(registrationFlowCharge({ price: 0, seats: 2, status: "confirmed" })).toEqual({
      totalAmount: 0,
      status: "confirmed",
      paymentRequired: false,
    });
    expect(registrationFlowCharge({ price: 1500, seats: 2, status: "confirmed" })).toEqual({
      totalAmount: 3000,
      status: "pending_payment",
      paymentRequired: true,
    });
    expect(registrationFlowCharge({ price: 1500, seats: 1, status: "waitlist" })).toBeNull();
  });
});
