import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NAGO_TEMPLATE } from "@/lib/landing/nagoTemplateImages";
import { NagoReveal } from "@/components/organisms/NagoReveal";

export function LandingNagoConvert({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);
  const wa = t("contact.whatsappUrl").trim();

  return (
    <section
      id="contacto"
      className="nago-convert scroll-mt-24"
    >
      <Image
        src={NAGO_TEMPLATE.convert}
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-[center_40%]"
      />
      <div className="nago-convert-veil" aria-hidden />
      <div className="relative z-10 mx-auto grid min-h-[28rem] max-w-7xl items-center gap-8 px-[max(1.25rem,env(safe-area-inset-left))] py-20 pe-[max(1.25rem,env(safe-area-inset-right))] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <NagoReveal>
          <h2 className="nago-display text-4xl leading-[0.95] text-white md:text-6xl">
            {t("cta.title")}
          </h2>
          <p className="mt-5 max-w-md text-white/80">{t("cta.subtitle")}</p>
        </NagoReveal>
        <NagoReveal>
          <div className="flex flex-col gap-3 lg:items-stretch">
            <Link href={`/${locale}/register`} className="nago-btn nago-btn-solid min-h-[3.25rem] min-w-[12rem] justify-center">
              {t("cta.button")}
            </Link>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="nago-btn nago-btn-dark min-h-[3.25rem] min-w-[12rem] justify-center"
              >
                {t("cta.whatsapp")}
              </a>
            ) : null}
          </div>
        </NagoReveal>
      </div>
    </section>
  );
}
