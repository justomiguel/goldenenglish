import {
  MZ_GUIDE_STAGE_MODALITIES,
  type MzGuideAgeBand,
  type MzGuideAttendance,
  type MzGuideModality,
  type MzGuideOffer,
  type MzGuideStage,
} from "@/lib/landing/mozarthitos/familyGuideCatalog";

export interface MzGuideStageRecommendation {
  stage: MzGuideStage;
  offers: MzGuideOffer[];
}

export type MzFamilyGuideResult =
  | { kind: "waitlist"; stage: "baby_mago"; modality: MzGuideModality }
  | {
      kind: "recommendation";
      primary: MzGuideStageRecommendation;
      secondary: MzGuideStageRecommendation | null;
      showChoirLink: boolean;
    };

const STAGES_BY_AGE: Readonly<
  Record<Exclude<MzGuideAgeBand, "under_6m">, readonly [MzGuideStage, MzGuideStage?]>
> = {
  "6m_2y": ["baby_mago"],
  "3y_4y": ["little_musicians"],
  "5y_7y": ["little_musicians", "instrument"],
  "8y_plus": ["instrument"],
  adult: ["adult_choir"],
};

function offersFor(stage: MzGuideStage, attendance: MzGuideAttendance): MzGuideOffer[] {
  const modalities = MZ_GUIDE_STAGE_MODALITIES[stage];
  const remote: MzGuideOffer[] = modalities.filter((m) => m !== "in_person");
  const remoteOrContact = remote.length > 0 ? remote : (["contact"] as MzGuideOffer[]);
  if (attendance === "in_person") return ["in_person"];
  if (attendance === "remote") return remoteOrContact;
  return ["in_person", ...remoteOrContact];
}

/** Maps the two family answers to the stage and the offers to show. */
export function resolveFamilyGuide(input: {
  ageBand: MzGuideAgeBand;
  attendance: MzGuideAttendance;
}): MzFamilyGuideResult {
  if (input.ageBand === "under_6m") {
    return {
      kind: "waitlist",
      stage: "baby_mago",
      modality: input.attendance === "remote" ? "live_online" : "in_person",
    };
  }
  const [primaryStage, secondaryStage] = STAGES_BY_AGE[input.ageBand];
  return {
    kind: "recommendation",
    primary: { stage: primaryStage, offers: offersFor(primaryStage, input.attendance) },
    secondary: secondaryStage
      ? { stage: secondaryStage, offers: offersFor(secondaryStage, input.attendance) }
      : null,
    showChoirLink: primaryStage !== "adult_choir",
  };
}
