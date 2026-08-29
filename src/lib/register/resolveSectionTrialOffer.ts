export type SectionTrialOfferInput = {
  offersTrial: boolean | null;
  trialFeeAmount: number | null;
};

export type CohortTrialOfferInput = {
  offersTrial: boolean;
  trialFeeAmount: number;
};

export type ResolvedSectionTrialOffer = {
  offers: boolean;
  amount: number;
};

export function resolveSectionTrialOffer(
  section: SectionTrialOfferInput,
  cohort: CohortTrialOfferInput,
): ResolvedSectionTrialOffer {
  const offers = section.offersTrial ?? cohort.offersTrial;
  if (!offers) return { offers: false, amount: 0 };
  const amount = section.trialFeeAmount ?? cohort.trialFeeAmount;
  return { offers: true, amount };
}
