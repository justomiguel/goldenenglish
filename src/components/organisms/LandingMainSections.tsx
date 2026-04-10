import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LandingHero } from "@/components/organisms/LandingHero";
import { LandingStory } from "@/components/organisms/LandingStory";
import { LandingOffer } from "@/components/organisms/LandingOffer";
import { LandingLevels } from "@/components/organisms/LandingLevels";
import { LandingCertifications } from "@/components/organisms/LandingCertifications";

interface LandingMainSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
}

export function LandingMainSections({
  dict,
  brand,
  locale,
  sessionEmail,
}: LandingMainSectionsProps) {
  return (
    <main>
      <LandingHero
        dict={dict}
        brand={brand}
        locale={locale}
        sessionEmail={sessionEmail}
      />
      <LandingStory dict={dict} brand={brand} />
      <LandingOffer dict={dict} />
      <LandingLevels dict={dict} />
      <LandingCertifications dict={dict} brand={brand} />
    </main>
  );
}
