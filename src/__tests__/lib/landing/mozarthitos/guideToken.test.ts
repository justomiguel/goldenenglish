import { describe, expect, it } from "vitest";
import {
  buildGuideRegisterHref,
  formatGuideToken,
  parseGuideToken,
  readGuideAnswers,
} from "@/lib/landing/mozarthitos/guideToken";

describe("parseGuideToken", () => {
  it("parses a valid token", () => {
    expect(parseGuideToken("baby_mago.in_person.6m_2y")).toEqual({
      stage: "baby_mago",
      modality: "in_person",
      ageBand: "6m_2y",
    });
  });

  it("rejects unknown parts and wrong shapes", () => {
    expect(parseGuideToken("baby_mago.in_person")).toBeNull();
    expect(parseGuideToken("violin.in_person.6m_2y")).toBeNull();
    expect(parseGuideToken("baby_mago.teleport.6m_2y")).toBeNull();
    expect(parseGuideToken("baby_mago.in_person.6m_2y.extra")).toBeNull();
    expect(parseGuideToken("<script>.in_person.6m_2y")).toBeNull();
    expect(parseGuideToken(undefined)).toBeNull();
    expect(parseGuideToken(["baby_mago.in_person.6m_2y"])).toBeNull();
  });

  it("rejects a modality the stage does not offer", () => {
    expect(parseGuideToken("instrument.live_online.8y_plus")).toBeNull();
    expect(parseGuideToken("adult_choir.pack.adult")).toBeNull();
  });

  it("round-trips with formatGuideToken", () => {
    const choice = { stage: "little_musicians", modality: "pack", ageBand: "3y_4y" } as const;
    expect(parseGuideToken(formatGuideToken(choice))).toEqual(choice);
  });
});

describe("buildGuideRegisterHref", () => {
  it("builds a trial href with the guide token", () => {
    expect(
      buildGuideRegisterHref("es", "trial", {
        stage: "baby_mago",
        modality: "live_online",
        ageBand: "6m_2y",
      }),
    ).toBe("/es/register?intent=trial&guide=baby_mago.live_online.6m_2y");
  });
});

describe("readGuideAnswers", () => {
  it("reads valid query answers and ignores the rest", () => {
    expect(readGuideAnswers({ edad: "3y_4y", modalidad: "remote" })).toEqual({
      ageBand: "3y_4y",
      attendance: "remote",
    });
    expect(readGuideAnswers({ edad: "99", modalidad: ["remote"] })).toEqual({
      ageBand: null,
      attendance: null,
    });
  });
});
