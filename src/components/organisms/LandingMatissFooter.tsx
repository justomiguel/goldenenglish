import Link from "next/link";
import type { BrandPublic } from "@/lib/brand/server";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import type { Dictionary } from "@/types/i18n";

export interface LandingMatissFooterProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  links: { href: string; label: string }[];
}

export function LandingMatissFooter({ dict, brand, locale, links }: LandingMatissFooterProps) {
  const t = (path: string) => marketingLandingCopy(dict, "matiss", path);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--matiss-footer)] px-[max(1.5rem,env(safe-area-inset-left))] py-14 pe-[max(1.5rem,env(safe-area-inset-right))] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
        <div>
          <p className="matiss-display text-2xl">{brand.name}</p>
          <p className="mt-2 text-sm text-white/80">{t("footer.siguenos")}</p>
          {brand.socialInstagram ? (
            <a href={brand.socialInstagram} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-[44px] items-center text-sm underline">
              matiss.studio
            </a>
          ) : null}
        </div>
        <div>
          <p className="text-sm font-semibold">{t("footer.enlacesTitle")}</p>
          <ul className="mt-2">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-[36px] items-center text-sm text-white/80 hover:text-white">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("footer.contactoTitle")}</p>
          <p className="mt-2 text-sm text-white/80">{t("contact.directorName")}</p>
          {brand.contactPhone ? <a href={`tel:${brand.contactPhone.replace(/\s/g, "")}`} className="mt-1 block text-sm underline">{brand.contactPhone}</a> : null}
          {brand.contactEmail ? <a href={`mailto:${brand.contactEmail}`} className="mt-1 block text-sm underline">{brand.contactEmail}</a> : null}
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-white/70">© {year} {brand.name}. {t("footer.rightsLine")}</p>
      <Link href={`/${locale}`} className="sr-only">{brand.name}</Link>
    </footer>
  );
}
