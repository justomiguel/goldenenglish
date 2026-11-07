import type {
  MzGuideAgeBand,
  MzGuideOffer,
  MzGuideStage,
} from "@/lib/landing/mozarthitos/familyGuideCatalog";
import type { MzFamilyGuideResult } from "@/lib/landing/mozarthitos/resolveFamilyGuide";
import { buildGuideRegisterHref } from "@/lib/landing/mozarthitos/guideToken";
import type { Dictionary } from "@/types/i18n";

export type MzGuideLabels = Dictionary["landing"]["mz"]["guide"];

export interface MzGuideOfferView {
  id: MzGuideOffer;
  title: string;
  body: string;
  /** Sede line for the in-person offer; `null` for other offers. */
  place: string | null;
  cta: string;
  href: string;
}

export interface MzGuideStageView {
  stage: MzGuideStage;
  title: string;
  ages: string;
  inClass: string;
  yourPart: string;
  length: string;
  offers: MzGuideOfferView[];
}

export type MzFamilyGuideView =
  | { kind: "waitlist"; title: string; body: string; cta: string; href: string }
  | {
      kind: "recommendation";
      primary: MzGuideStageView;
      secondary: MzGuideStageView | null;
      choir: { label: string; href: string } | null;
    };

interface BuildArgs {
  locale: string;
  ageBand: MzGuideAgeBand;
  result: MzFamilyGuideResult;
  labels: MzGuideLabels;
  /** Visible sede line, e.g. "Sede Las Condes · República Árabe de Egipto 670". */
  place: string;
}

function offerView(
  args: BuildArgs,
  stage: MzGuideStage,
  offer: MzGuideOffer,
): MzGuideOfferView {
  const copy = args.labels.offer[offer];
  const href =
    offer === "contact"
      ? `/${args.locale}#contacto`
      : buildGuideRegisterHref(args.locale, "trial", {
          stage,
          modality: offer,
          ageBand: args.ageBand,
        });
  return {
    id: offer,
    title: copy.title,
    body: copy.body,
    place: offer === "in_person" ? args.place : null,
    cta: copy.cta,
    href,
  };
}

function stageView(
  args: BuildArgs,
  pick: { stage: MzGuideStage; offers: MzGuideOffer[] },
): MzGuideStageView {
  const copy = args.labels.stage[pick.stage];
  return {
    stage: pick.stage,
    title: copy.title,
    ages: copy.ages,
    inClass: copy.inClass,
    yourPart: copy.yourPart,
    length: copy.length,
    offers: pick.offers.map((offer) => offerView(args, pick.stage, offer)),
  };
}

/** Maps a guide result to display copy and CTA links. Both surfaces render this. */
export function buildFamilyGuideView(args: BuildArgs): MzFamilyGuideView {
  const { result, labels, locale } = args;
  if (result.kind === "waitlist") {
    return {
      kind: "waitlist",
      title: labels.waitlist.title,
      body: labels.waitlist.body,
      cta: labels.waitlist.cta,
      href: buildGuideRegisterHref(locale, "reserve", {
        stage: result.stage,
        modality: result.modality,
        ageBand: args.ageBand,
      }),
    };
  }
  return {
    kind: "recommendation",
    primary: stageView(args, result.primary),
    secondary: result.secondary ? stageView(args, result.secondary) : null,
    choir: result.showChoirLink
      ? {
          label: labels.choirLink,
          href: buildGuideRegisterHref(locale, "trial", {
            stage: "adult_choir",
            modality: "in_person",
            ageBand: "adult",
          }),
        }
      : null,
  };
}
