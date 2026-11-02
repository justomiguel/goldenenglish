import type { Dictionary } from "@/types/i18n";
import { PulsarHomeClose } from "@/components/organisms/pulsar/PulsarHomeClose";
import { PulsarHomeHero } from "@/components/organisms/pulsar/PulsarHomeHero";
import { PulsarHomeHow } from "@/components/organisms/pulsar/PulsarHomeHow";
import { PulsarHomeIdentity } from "@/components/organisms/pulsar/PulsarHomeIdentity";
import { PulsarHomeProof } from "@/components/organisms/pulsar/PulsarHomeProof";
import { PulsarHomeStory } from "@/components/organisms/pulsar/PulsarHomeStory";
import { PulsarSiteChromeEntry } from "@/components/organisms/pulsar/PulsarSiteChromeEntry";
import { PulsarSolutionShowcase } from "@/components/organisms/pulsar/PulsarSolutionShowcase";
import { PulsarVoiceCarousel } from "@/components/organisms/pulsar/PulsarVoiceCarousel";
import { PulsarHomeBenefits } from "@/components/organisms/pulsar/PulsarHomeBenefits";
import type { PulsarClientSummary } from "@/components/organisms/pulsar/PulsarClientesView";
import type { CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";

export interface PulsarLandingHomeProps {
  locale: string;
  dict: Dictionary;
  activeTenantCount: number;
  featuredClients?: readonly PulsarClientSummary[];
  logoClients?: readonly PulsarClientSummary[];
  email?: string | null;
  market?: CentrolistoMarketCode;
}

export function PulsarLandingHome({
  locale,
  dict,
  activeTenantCount,
  featuredClients = [],
  logoClients,
  email = null,
  market = "cl",
}: PulsarLandingHomeProps) {
  return (
    <PulsarSiteChromeEntry locale={locale} dict={dict} email={email} market={market} activeNav="home">
      <PulsarHomeHero locale={locale} dict={dict} />
      <PulsarHomeProof
        locale={locale}
        dict={dict}
        activeTenantCount={activeTenantCount}
        featuredClients={featuredClients}
        logoClients={logoClients ?? featuredClients}
      />
      <PulsarSolutionShowcase locale={locale} dict={dict} market={market} />
      <PulsarHomeStory dict={dict} />
      <PulsarHomeBenefits dict={dict} />
      <PulsarHomeIdentity dict={dict} />
      <PulsarVoiceCarousel dict={dict} />
      <PulsarHomeHow dict={dict} />
      <PulsarHomeClose locale={locale} dict={dict} />
    </PulsarSiteChromeEntry>
  );
}
