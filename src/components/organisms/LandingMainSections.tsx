import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LandingHero } from "@/components/organisms/LandingHero";
import { LandingStory } from "@/components/organisms/LandingStory";
import { LandingModalities } from "@/components/organisms/LandingModalities";
import { LandingLevels } from "@/components/organisms/LandingLevels";
import { LandingCertifications } from "@/components/organisms/LandingCertifications";

/** Orden: hero → historia → modalidades (incluye públicos y cards) → niveles → certificaciones. */
interface LandingMainSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  inscriptionsOpen: boolean;
}

export function LandingMainSections({
  dict,
  brand,
  locale,
  sessionEmail,
  inscriptionsOpen,
}: LandingMainSectionsProps) {
  return (
    <main>
      <LandingHero
        dict={dict}
        brand={brand}
        locale={locale}
        sessionEmail={sessionEmail}
        inscriptionsOpen={inscriptionsOpen}
      />
      <LandingStory dict={dict} brand={brand} />
      <LandingModalities dict={dict} />
      <LandingLevels dict={dict} />
      <LandingCertifications dict={dict} />
    </main>
  );
}
