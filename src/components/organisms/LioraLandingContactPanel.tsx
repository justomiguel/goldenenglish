import type { Dictionary } from "@/types/i18n";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";

export interface LioraLandingContactPanelProps {
  dict: Dictionary;
  locale: string;
}

/**
 * Headline + helper copy come from `landing.liora.cta`; form labels from `publicContact`.
 * Lives inside the closing CTA band so "contact us" is a single bloc on the landing.
 */
export function LioraLandingContactPanel({
  dict,
  locale,
}: LioraLandingContactPanelProps) {
  const pc = dict.publicContact;
  return (
    <div
      id="contacto"
      className="mx-auto mt-10 max-w-2xl scroll-mt-[max(6rem,env(safe-area-inset-top)+4rem)]"
    >
      <p className="text-center text-sm text-[var(--liora-ink-soft)] md:text-base">
        {pc.lead}
      </p>
      <div className="liora-card mt-6 p-6 text-[var(--liora-ink)] md:mt-8 md:p-8">
        <PublicContactForm locale={locale} labels={pc} embedded />
      </div>
    </div>
  );
}
