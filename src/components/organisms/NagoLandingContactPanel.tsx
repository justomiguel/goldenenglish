import type { Dictionary } from "@/types/i18n";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";

export interface NagoLandingContactPanelProps {
  dict: Dictionary;
  locale: string;
}

/**
 * Headline + helper copy come from `landing.nago.cta`; form labels from `publicContact`.
 * Used inside the green CTA band so "contact us" messaging is not duplicated as a second section.
 */
export function NagoLandingContactPanel({
  dict,
  locale,
}: NagoLandingContactPanelProps) {
  const pc = dict.publicContact;
  return (
    <div id="contacto" className="mx-auto mt-10 max-w-2xl scroll-mt-[max(6rem,env(safe-area-inset-top)+4rem)]">
      <p className="text-center text-sm text-white/90 md:text-base">{pc.lead}</p>
      <div className="mt-6 rounded-2xl border border-white/22 bg-[var(--color-surface)] p-6 text-[var(--color-foreground)] shadow-lg md:mt-8 md:p-8">
        <PublicContactForm locale={locale} labels={pc} embedded />
      </div>
    </div>
  );
}
