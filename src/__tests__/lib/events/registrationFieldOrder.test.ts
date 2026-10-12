import { describe, expect, it } from "vitest";
import {
  resolveRegistrationFieldOrder,
  retainHiddenBirthDateToken,
} from "@/lib/events/registrationFieldOrder";

const SCHOOL = "11111111-1111-4111-8111-111111111111";
const DIET = "22222222-2222-4222-8222-222222222222";

describe("resolveRegistrationFieldOrder", () => {
  it("keeps the legacy layout when no order is stored", () => {
    const order = resolveRegistrationFieldOrder({
      stored: [],
      extras: [
        { id: DIET, position: 2 },
        { id: SCHOOL, position: 0 },
      ],
      collectBirthDate: true,
    });
    expect(order).toEqual([
      "base:firstName",
      "base:lastName",
      "base:dniOrPassport",
      "base:email",
      "base:phone",
      "base:birthDate",
      `field:${SCHOOL}`,
      `field:${DIET}`,
    ]);
  });

  it("interleaves base fields and extras, drops archived ids, and appends missing fields", () => {
    const order = resolveRegistrationFieldOrder({
      stored: [
        "base:email",
        `field:${SCHOOL}`,
        "base:phone",
        "field:not-a-real-field",
        "base:email",
        "base:birthDate",
      ],
      extras: [
        { id: SCHOOL, position: 0 },
        { id: DIET, position: 1 },
        { id: "33333333-3333-4333-8333-333333333333", position: 2, archived: true },
      ],
      collectBirthDate: false,
    });
    expect(order).toEqual([
      "base:email",
      `field:${SCHOOL}`,
      "base:phone",
      "base:firstName",
      "base:lastName",
      "base:dniOrPassport",
      `field:${DIET}`,
    ]);
  });
});

describe("retainHiddenBirthDateToken", () => {
  it("puts the birth-date token back in front of the same following field", () => {
    const next = retainHiddenBirthDateToken(
      ["base:phone", "base:birthDate", "base:email"],
      ["base:phone", "base:email"],
      false,
    );
    expect(next).toEqual(["base:phone", "base:birthDate", "base:email"]);
  });
});
