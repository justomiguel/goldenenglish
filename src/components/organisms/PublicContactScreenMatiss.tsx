import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";
import { MatissFontRoot } from "@/components/organisms/MatissFontRoot";
import { MatissSiteHeader } from "@/components/organisms/MatissSiteHeader";

export interface PublicContactScreenMatissProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail?: string | null;
}

export function PublicContactScreenMatiss({
  locale,
  dict,
  brand,
  sessionEmail = null,
}: PublicContactScreenMatissProps) {
  const t = (path: string) => marketingLandingCopy(dict, "matiss", path);
  const pc = dict.publicContact;

  return (
    <MatissFontRoot className="relative min-h-screen pb-16">
      <MatissSiteHeader
        locale={locale}
        logoSrc={brand.logoPath}
        logoAlt={brand.logoAlt}
        dict={dict}
        sessionEmail={sessionEmail}
        links={[{ href: `/${locale}`, label: t("nav.inicio") }]}
        openMenu={t("chrome.openMenu")}
        closeMenu={t("chrome.closeMenu")}
      />
      <div className="mx-auto w-full max-w-lg px-4 pt-10">
        <h1 className="matiss-display text-4xl text-[var(--matiss-ink)]">{pc.title}</h1>
        <p className="mt-4 text-[var(--matiss-ink-soft)]">{pc.lead}</p>
        <div className="mt-8 rounded-3xl bg-white p-6">
          <PublicContactForm locale={locale} labels={pc} />
        </div>
        <p className="mt-6 text-sm text-[var(--matiss-ink-soft)]">
          {t("sedes.sanMiguel.name")} · {t("sedes.laFlorida.name")}
        </p>
        <p className="mt-4">
          <Link href={`/${locale}/login`} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--matiss-violet-deep)] underline">
            <LogIn className="h-4 w-4" aria-hidden />
            {dict.login.title}
          </Link>
        </p>
      </div>
    </MatissFontRoot>
  );
}
