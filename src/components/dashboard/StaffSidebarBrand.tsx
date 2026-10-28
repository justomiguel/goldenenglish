import Image from "next/image";
import Link from "next/link";
import type { BrandPublic } from "@/lib/brand/server";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";

const logoFrame =
  "rounded-3xl bg-[var(--color-background)] object-contain p-1 ring-1 ring-[var(--color-border)]";

export function StaffSidebarBrand({
  href,
  brand,
  locale,
  fit = false,
}: {
  href: string;
  brand: BrandPublic;
  locale: string;
  /** Scale the logo to the free height. Desktop rails keep the fixed size. */
  fit?: boolean;
}) {
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");
  const tagline = taglineForLocale(brand, locale);
  const alt = brand.logoAlt || brand.name;
  return (
    <Link
      href={href}
      className={
        fit
          ? "flex h-full min-h-0 flex-col items-center justify-center overflow-hidden px-14 py-1"
          : "flex flex-col items-center px-5 pb-3 pt-5"
      }
    >
      {fit ? (
        <span className="@container flex min-h-0 w-full flex-1 items-center justify-center">
          <span className={`relative aspect-square w-[min(100%,100cqh)] max-w-full ${logoFrame}`}>
            <Image
              src={brand.logoPath}
              alt={alt}
              fill
              sizes="70vw"
              unoptimized={bypassLogoOptimizer}
              className="object-contain p-1"
            />
          </span>
        </span>
      ) : (
        <Image
          src={brand.logoPath}
          alt={alt}
          width={128}
          height={128}
          unoptimized={bypassLogoOptimizer}
          className={`h-32 w-32 ${logoFrame}`}
        />
      )}
      <span
        className={`shrink-0 text-center font-display font-bold leading-tight tracking-tight text-[var(--color-primary)] ${
          fit ? "mt-1 text-2xl" : "mt-2.5 text-3xl"
        }`}
      >
        {brand.name}
      </span>
      {tagline ? (
        <span
          className={`mt-1 shrink-0 text-center text-xs leading-snug text-[var(--color-muted-foreground)] ${
            fit ? "line-clamp-1" : "line-clamp-2"
          }`}
        >
          {tagline}
        </span>
      ) : null}
    </Link>
  );
}
