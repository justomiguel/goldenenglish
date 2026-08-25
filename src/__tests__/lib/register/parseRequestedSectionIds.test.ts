import { describe, expect, it } from "vitest";
import { parseRequestedSectionIds } from "@/lib/register/parseRequestedSectionIds";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";
const ORDER = [A, B, C];

describe("parseRequestedSectionIds", () => {
  it("rejects undecided together with a concrete section", () => {
    const r = parseRequestedSectionIds({
      selectedIds: [REGISTRATION_UNDECIDED_FORM_VALUE, A],
      sectionOptionsOrder: ORDER,
      allowUndecided: true,
    });
    expect(r).toEqual({ ok: false, reason: "undecided_with_extras" });
  });

  it("treats undecided alone as no sections", () => {
    const r = parseRequestedSectionIds({
      selectedIds: [REGISTRATION_UNDECIDED_FORM_VALUE],
      sectionOptionsOrder: ORDER,
      allowUndecided: true,
    });
    expect(r).toEqual({
      ok: true,
      preferredSectionId: null,
      additionalSectionIds: [],
      undecided: true,
    });
  });

  it("picks preferred by options order, not click order", () => {
    const r = parseRequestedSectionIds({
      selectedIds: [C, A],
      sectionOptionsOrder: ORDER,
      allowUndecided: true,
    });
    expect(r).toEqual({
      ok: true,
      preferredSectionId: A,
      additionalSectionIds: [C],
      undecided: false,
    });
  });

  it("keeps a locked token section as preferred and out of the extras array", () => {
    const r = parseRequestedSectionIds({
      selectedIds: [B, A],
      sectionOptionsOrder: ORDER,
      lockedPreferredId: A,
      allowUndecided: false,
    });
    expect(r).toEqual({
      ok: true,
      preferredSectionId: A,
      additionalSectionIds: [B],
      undecided: false,
    });
  });

  it("drops ids that are not on the public options list", () => {
    const r = parseRequestedSectionIds({
      selectedIds: [A, "99999999-9999-4999-8999-999999999999"],
      sectionOptionsOrder: ORDER,
      allowUndecided: true,
    });
    expect(r).toEqual({
      ok: true,
      preferredSectionId: A,
      additionalSectionIds: [],
      undecided: false,
    });
  });
});
