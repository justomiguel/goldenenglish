import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

export type PublicRegisterCtaItem = {
  href: string;
  label: string;
  intent: "reserve" | "trial";
};

export function publicRegisterCtaItems(input: {
  locale: string;
  mode: PublicCtaMode;
  inscriptionsEnabled: boolean;
  reserveLabel: string;
  trialLabel: string;
}): PublicRegisterCtaItem[] {
  if (!input.inscriptionsEnabled) return [];
  const reserve: PublicRegisterCtaItem = {
    href: `/${input.locale}/register`,
    label: input.reserveLabel,
    intent: "reserve",
  };
  const trial: PublicRegisterCtaItem = {
    href: `/${input.locale}/register?intent=trial`,
    label: input.trialLabel,
    intent: "trial",
  };
  if (input.mode === "trial") return [trial];
  if (input.mode === "both") return [reserve, trial];
  return [reserve];
}
