import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";
import { publicRegisterCtaItems } from "@/lib/settings/publicRegisterCtaItems";

export function nagoLandingRegisterCtas(input: {
  locale: string;
  dict: Dictionary;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}) {
  return publicRegisterCtaItems({
    locale: input.locale,
    mode: input.publicCtaMode ?? "both",
    inscriptionsEnabled: input.inscriptionsEnabled ?? true,
    reserveLabel: marketingLandingCopy(input.dict, "nago", "hero.ctaReserve"),
    trialLabel: marketingLandingCopy(input.dict, "nago", "hero.ctaTrial"),
  });
}
