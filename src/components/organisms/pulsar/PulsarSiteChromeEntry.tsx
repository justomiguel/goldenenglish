"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PulsarSiteChrome, type PulsarSiteChromeProps } from "@/components/organisms/pulsar/PulsarSiteChrome";
import { PulsarSiteChromePwa } from "@/components/pwa/organisms/PulsarSiteChromePwa";

export function PulsarSiteChromeEntry(props: PulsarSiteChromeProps) {
  return (
    <SurfaceMountGate
      skeleton={<PulsarSiteChrome {...props} />}
      desktop={<PulsarSiteChrome {...props} />}
      narrow={() => <PulsarSiteChromePwa {...props} />}
    />
  );
}
