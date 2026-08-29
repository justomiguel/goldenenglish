import type { Dictionary } from "@/types/i18n";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";
import { publicRegisterCtaItems } from "@/lib/settings/publicRegisterCtaItems";

export function landingRegisterCtasFromDict(input: {
  locale: string;
  dict: Dictionary;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}) {
  return publicRegisterCtaItems({
    locale: input.locale,
    mode: input.publicCtaMode ?? "reserve",
    inscriptionsEnabled: input.inscriptionsEnabled ?? true,
    reserveLabel: input.dict.landing.hero.ctaReserveSpot,
    trialLabel: input.dict.landing.hero.ctaTrialClass,
  });
}
