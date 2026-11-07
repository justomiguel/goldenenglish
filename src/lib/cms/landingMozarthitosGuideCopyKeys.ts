import {
  MZ_GUIDE_AGE_BANDS,
  MZ_GUIDE_ATTENDANCE,
  MZ_GUIDE_STAGES,
} from "@/lib/landing/mozarthitos/familyGuideCatalog";

const STAGE_FIELDS = ["title", "ages", "inClass", "yourPart", "length"] as const;
const OFFER_IDS = ["in_person", "live_online", "pack", "contact"] as const;
const OFFER_FIELDS = ["title", "body", "cta"] as const;

/** Editable `dict.landing.mz.guide.*` copy for the family guide page (CMS section `niveles`). */
export const MOZARTHITOS_GUIDE_COPY_KEYS: ReadonlyArray<string> = [
  ...[
    "metaTitle",
    "metaDescription",
    "entryCta",
    "title",
    "lead",
    "stepLabel",
    "ageQuestion",
    "attendanceQuestion",
    "back",
    "restart",
    "resultKicker",
    "alsoTitle",
    "inClassLabel",
    "yourPartLabel",
    "lengthLabel",
    "choirLink",
    "registerSummary",
    "registerSummaryChange",
  ].map((k) => `mz.guide.${k}`),
  ...MZ_GUIDE_AGE_BANDS.map((id) => `mz.guide.age.${id}`),
  ...MZ_GUIDE_ATTENDANCE.map((id) => `mz.guide.attendance.${id}`),
  ...MZ_GUIDE_STAGES.flatMap((id) => STAGE_FIELDS.map((f) => `mz.guide.stage.${id}.${f}`)),
  ...OFFER_IDS.flatMap((id) => OFFER_FIELDS.map((f) => `mz.guide.offer.${id}.${f}`)),
  ...(["title", "body", "cta"] as const).map((f) => `mz.guide.waitlist.${f}`),
];
