import { describe, expect, it } from "vitest";
import { resolveFamilyGuide } from "@/lib/landing/mozarthitos/resolveFamilyGuide";
import {
  MZ_GUIDE_AGE_BANDS,
  MZ_GUIDE_ATTENDANCE,
} from "@/lib/landing/mozarthitos/familyGuideCatalog";

describe("resolveFamilyGuide", () => {
  it("returns a waitlist for babies under 6 months", () => {
    expect(resolveFamilyGuide({ ageBand: "under_6m", attendance: "in_person" })).toEqual({
      kind: "waitlist",
      stage: "baby_mago",
      modality: "in_person",
    });
    expect(resolveFamilyGuide({ ageBand: "under_6m", attendance: "remote" })).toMatchObject({
      kind: "waitlist",
      modality: "live_online",
    });
  });

  it("maps 6 months to 2 years to Baby Mago with in-person first", () => {
    const result = resolveFamilyGuide({ ageBand: "6m_2y", attendance: "in_person" });
    expect(result).toEqual({
      kind: "recommendation",
      primary: { stage: "baby_mago", offers: ["in_person"] },
      secondary: null,
      showChoirLink: true,
    });
  });

  it("gives remote families the live class and the pack", () => {
    const result = resolveFamilyGuide({ ageBand: "3y_4y", attendance: "remote" });
    expect(result).toMatchObject({
      kind: "recommendation",
      primary: { stage: "little_musicians", offers: ["live_online", "pack"] },
    });
  });

  it("shows in-person first and remote below when the family is unsure", () => {
    const result = resolveFamilyGuide({ ageBand: "6m_2y", attendance: "unsure" });
    expect(result).toMatchObject({
      primary: { stage: "baby_mago", offers: ["in_person", "live_online", "pack"] },
    });
  });

  it("adds the instrument as a second option from 5 to 7 years", () => {
    const result = resolveFamilyGuide({ ageBand: "5y_7y", attendance: "in_person" });
    expect(result).toMatchObject({
      primary: { stage: "little_musicians" },
      secondary: { stage: "instrument", offers: ["in_person"] },
    });
  });

  it("sends remote instrument families to contact", () => {
    const result = resolveFamilyGuide({ ageBand: "8y_plus", attendance: "remote" });
    expect(result).toMatchObject({
      primary: { stage: "instrument", offers: ["contact"] },
    });
  });

  it("shows the adult choir without the choir link", () => {
    const result = resolveFamilyGuide({ ageBand: "adult", attendance: "unsure" });
    expect(result).toMatchObject({
      primary: { stage: "adult_choir", offers: ["in_person", "contact"] },
      showChoirLink: false,
    });
  });

  it("returns a result for every age and attendance pair", () => {
    for (const ageBand of MZ_GUIDE_AGE_BANDS) {
      for (const attendance of MZ_GUIDE_ATTENDANCE) {
        expect(resolveFamilyGuide({ ageBand, attendance }).kind).toMatch(
          /^(waitlist|recommendation)$/,
        );
      }
    }
  });
});
