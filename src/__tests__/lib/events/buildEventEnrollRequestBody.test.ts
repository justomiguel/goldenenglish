import { describe, expect, it } from "vitest";
import { buildEventEnrollRequestBody } from "@/lib/events/buildEventEnrollRequestBody";

const tutor = {
  tutorFirstName: "",
  tutorLastName: "",
  tutorDniOrPassport: "",
  tutorEmail: "",
  tutorPhone: "",
  tutorRelationship: "",
};

describe("buildEventEnrollRequestBody", () => {
  it("sends the transfer option and source when the buyer chose them", () => {
    const body = buildEventEnrollRequestBody({
      locale: "es",
      firstName: "Ana",
      lastName: "García",
      dni: "1",
      email: "ana@example.com",
      phone: "",
      birthDate: "",
      isMinor: false,
      tutor,
      fieldValues: [],
      isLocalResident: true,
      paymentMethod: "transfer",
      showPaymentPicker: true,
      familyDiscountClaimed: false,
      transferOptionId: "opt-a",
      transferSourceKey: "source_1",
    });

    expect(body).toMatchObject({
      paymentMethod: "transfer",
      transferOptionId: "opt-a",
      transferSourceKey: "source_1",
    });
    expect(body).not.toHaveProperty("birthDate");
    expect(body).not.toHaveProperty("seatKeys");
  });

  it("includes the minor tutor, seats, companions, and flow when they are present", () => {
    const body = buildEventEnrollRequestBody({
      locale: "es",
      firstName: "Ana",
      lastName: "García",
      dni: "1",
      email: "ana@example.com",
      phone: "",
      birthDate: " 2015-01-02 ",
      isMinor: true,
      tutor,
      fieldValues: [],
      isLocalResident: false,
      paymentMethod: "transfer",
      showPaymentPicker: false,
      flowId: "flow-1",
      familyDiscountClaimed: true,
      discountCode: "FIJO",
      seatKeys: ["a"],
      companions: [{ firstName: "Luis", lastName: "García" }],
      minorTicketCount: 1,
    });

    expect(body.base).toMatchObject({ birthDate: "2015-01-02" });
    expect(body.tutor).toEqual(tutor);
    expect(body.paymentMethod).toBeUndefined();
    expect(body).toMatchObject({
      flowId: "flow-1",
      discountCode: "FIJO",
      seatKeys: ["a"],
      companions: [{ firstName: "Luis", lastName: "García" }],
      minorTicketCount: 1,
    });
  });
});