import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import { resolveLandingImageSrcForTheme, type LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";
import { MatissFontRoot } from "@/variants/owned/matiss/font/v1/Web";
import { MatissSiteHeader } from "@/variants/owned/matiss/header/v1/Web";

export interface PublicContactScreenMatissProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  mediaMap?: LandingMediaMap;
  sessionEmail?: string | null;
}

export function PublicContactScreenMatiss({
  locale,
  dict,
  brand,
  mediaMap,
  sessionEmail = null,
}: PublicContactScreenMatissProps) {
  const t = (path: string) => marketingLandingCopy(dict, "matiss", path);
  const pc = dict.publicContact;
  const photoSrc = resolveLandingImageSrcForTheme("matiss", "modalidades", "1.jpg", mediaMap);

  return (
    <MatissFontRoot className="relative min-h-screen pb-16">
      <MatissSiteHeader
        locale={locale}
        brandName={brand.name}
        logoAlt={brand.logoAlt}
        dict={dict}
        sessionEmail={sessionEmail}
        links={[{ href: `/${locale}`, label: t("nav.inicio") }]}
        openMenu={t("chrome.openMenu")}
        closeMenu={t("chrome.closeMenu")}
      />
      <div className="mx-auto grid w-full max-w-5xl items-start gap-8 px-4 pt-10 md:grid-cols-[16rem_1fr]">
        <Image
          src={photoSrc}
          alt={t("cta.photoAlt")}
          width={1152}
          height={864}
          className="mx-auto aspect-[4/3] w-full max-w-xs rounded-[36px] object-cover"
        />
        <div>
          <h1 className="matiss-display text-4xl text-[var(--ds-color-foreground)]">{pc.title}</h1>
          <p className="mt-4 text-[var(--ds-color-muted-foreground)]">{pc.lead}</p>
          <div className="mt-8 rounded-3xl bg-white p-6">
            <PublicContactForm locale={locale} labels={pc} />
          </div>
          <p className="mt-6 text-sm text-[var(--ds-color-muted-foreground)]">
            {t("sedes.sanMiguel.name")} · {t("sedes.laFlorida.name")}
          </p>
          <p className="mt-4">
            <Link href={`/${locale}/login`} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--ds-color-primary)] underline">
              <LogIn className="h-4 w-4" aria-hidden />
              {dict.login.title}
            </Link>
          </p>
        </div>
      </div>
    </MatissFontRoot>
  );
}

export default PublicContactScreenMatiss;
