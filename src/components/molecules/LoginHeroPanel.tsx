import Image from "next/image";
import Link from "next/link";
import type { BrandPublic } from "@/lib/brand/server";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";

interface LoginHeroPanelProps {
  brand: BrandPublic;
  locale: string;
}

/**
 * Institutional column for login — mirrors LandingHero treatment (navy, gold line, soft glows).
 */
export function LoginHeroPanel({ brand, locale }: LoginHeroPanelProps) {
  const homeHref = `/${locale}`;
  const tagline = taglineForLocale(brand, locale);

  return (
    <div className="relative z-[1] mx-auto w-full max-w-lg md:mx-0">
      <Link
        href={homeHref}
        className="group block rounded-[var(--layout-border-radius)] outline-none ring-offset-2 ring-offset-[var(--color-primary-dark)] transition duration-300 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <Image
          src={brand.logoPath}
          alt={brand.logoAlt || brand.name}
          width={96}
          height={96}
          className="mx-auto h-20 w-20 rounded-[var(--layout-border-radius)] shadow-[0_12px_40px_-8px_rgb(0_0_0_/45%)] ring-2 ring-white/15 transition duration-300 group-hover:ring-[var(--color-accent)]/50 md:mx-0 lg:h-24 lg:w-24"
          priority
        />
        <h2 className="font-display mt-7 text-center text-3xl font-semibold leading-[1.15] tracking-tight text-[var(--color-primary-foreground)] transition duration-300 group-hover:text-[var(--color-accent)] md:mt-8 md:text-left lg:text-4xl">
          {brand.name}
        </h2>
      </Link>
      {tagline ? (
        <p className="mt-5 text-pretty text-center text-base font-normal leading-relaxed text-[var(--color-primary-foreground)]/88 md:text-left md:text-lg">
          {tagline}
        </p>
      ) : null}
    </div>
  );
}
