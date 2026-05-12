import type { Dictionary } from "@/types/i18n";
import { LandingSection } from "@/components/molecules/LandingSection";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";

interface LandingContactBandProps {
  dict: Dictionary;
  locale: string;
}

/**
 * Canonical “contact us” strip for classic / editorial / minimal landings —
 * `#contacto` embeds the same portal-bound form used on `/contact`.
 */
export function LandingContactBand({ dict, locale }: LandingContactBandProps) {
  const pc = dict.publicContact;
  return (
    <LandingSection
      id="contacto"
      title={pc.title}
      className="bg-[var(--color-muted)]/35"
    >
      <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-[var(--color-muted-foreground)] md:text-lg">
        {pc.lead}
      </p>
      <div className="mx-auto w-full max-w-lg rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
        <PublicContactForm locale={locale} labels={pc} embedded />
      </div>
    </LandingSection>
  );
}
