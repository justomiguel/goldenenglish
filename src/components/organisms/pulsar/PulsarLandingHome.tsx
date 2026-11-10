import type { Dictionary } from "@/types/i18n";
import { PulsarHomeCharge } from "@/components/organisms/pulsar/PulsarHomeCharge";
import { PulsarHomeClose } from "@/components/organisms/pulsar/PulsarHomeClose";
import { PulsarHomeFriday } from "@/components/organisms/pulsar/PulsarHomeFriday";
import { PulsarHomeHero } from "@/components/organisms/pulsar/PulsarHomeHero";
import { PulsarHomeSunday } from "@/components/organisms/pulsar/PulsarHomeSunday";
import { PulsarHomeTuesday } from "@/components/organisms/pulsar/PulsarHomeTuesday";
import { PulsarSiteChromeEntry } from "@/components/organisms/pulsar/PulsarSiteChromeEntry";
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
  email = null,
  market = "cl",
}: PulsarLandingHomeProps) {
  return (
    <PulsarSiteChromeEntry locale={locale} dict={dict} email={email} market={market} activeNav="home">
      <PulsarHomeHero locale={locale} dict={dict} activeTenantCount={activeTenantCount} market={market} />
      <PulsarHomeSunday dict={dict} />
      <PulsarHomeTuesday dict={dict} />
      <PulsarHomeCharge dict={dict} />
      <PulsarHomeFriday dict={dict} />
      <PulsarHomeClose locale={locale} dict={dict} market={market} />
    </PulsarSiteChromeEntry>
  );
}
