import Image from "next/image";
import { PulsarAccountAuthForm } from "@/components/organisms/pulsar/PulsarAccountAuthForm";
import { PulsarSiteChromeEntry } from "@/components/organisms/pulsar/PulsarSiteChromeEntry";
import type { CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";
import type { Dictionary } from "@/types/i18n";

const WARDROBE_SRC = "/centrolisto/wardrobe/register-desk.jpg";

export function PulsarAccountAuthScreen({
  locale,
  dict,
  market,
  mode,
  copy,
  nextPath,
}: {
  locale: string;
  dict: Dictionary;
  market: CentrolistoMarketCode;
  mode: "login" | "register";
  copy: Dictionary["pulsar"]["account"];
  nextPath: string;
}) {
  return (
    <PulsarSiteChromeEntry locale={locale} dict={dict} email={null} market={market} activeNav="account">
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-14">
        <figure className="relative aspect-[4/3] overflow-hidden rounded-[var(--layout-border-radius)] lg:order-2">
          <Image
            src={WARDROBE_SRC}
            alt={copy.authPhotoAlt}
            fill
            priority
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="object-cover"
          />
        </figure>
        <div className="lg:order-1">
          <PulsarAccountAuthForm
            locale={locale}
            mode={mode}
            copy={copy}
            nextPath={nextPath}
            inlineSubmit
          />
        </div>
      </div>
    </PulsarSiteChromeEntry>
  );
}
