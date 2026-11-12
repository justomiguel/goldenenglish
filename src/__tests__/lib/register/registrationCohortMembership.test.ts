import { describe, expect, it } from "vitest";
import {
  registrationBelongsToCohort,
  resolveRegistrationCohortId,
} from "@/lib/register/registrationCohortMembership";

const open = "cohort-open";
const other = "cohort-other";

describe("resolveRegistrationCohortId", () => {
  it("falls back to the open cohort when the query is missing or unknown", () => {
    const cohorts = [{ id: open }, { id: other }];
    expect(resolveRegistrationCohortId(undefined, cohorts, open)).toBe(open);
    expect(resolveRegistrationCohortId("missing", cohorts, open)).toBe(open);
    expect(resolveRegistrationCohortId(other, cohorts, open)).toBe(other);
  });
});

describe("registrationBelongsToCohort", () => {
  it("keeps a lead with no section only on the open inscriptions cohort", () => {
    expect(
      registrationBelongsToCohort({
        selectedCohortId: open,
        openCohortId: open,
        status: "new",
        preferredSectionCohortId: null,
        activeSectionCohortIds: [],
      }),
    ).toBe(true);
    expect(
      registrationBelongsToCohort({
        selectedCohortId: other,
        openCohortId: open,
        status: "contacted",
        preferredSectionCohortId: null,
        activeSectionCohortIds: [],
      }),
    ).toBe(false);
  });

  it("keeps a lead with a preferred section only on that section cohort", () => {
    expect(
      registrationBelongsToCohort({
        selectedCohortId: other,
        openCohortId: open,
        status: "contacted",
        preferredSectionCohortId: other,
        activeSectionCohortIds: [],
      }),
    ).toBe(true);
    expect(
      registrationBelongsToCohort({
        selectedCohortId: open,
        openCohortId: open,
        status: "contacted",
        preferredSectionCohortId: other,
        activeSectionCohortIds: [],
      }),
    ).toBe(false);
  });

  it("keeps an enrolled student on the cohort of an active section", () => {
    expect(
      registrationBelongsToCohort({
        selectedCohortId: other,
        openCohortId: open,
        status: "enrolled",
        preferredSectionCohortId: open,
        activeSectionCohortIds: [other],
      }),
    ).toBe(true);
    expect(
      registrationBelongsToCohort({
        selectedCohortId: open,
        openCohortId: open,
        status: "enrolled",
        preferredSectionCohortId: null,
        activeSectionCohortIds: [other],
      }),
    ).toBe(false);
  });
});
