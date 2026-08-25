import Image from "next/image";
import Link from "next/link";
import type { BrandPublic } from "@/lib/brand/server";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";

export function StaffSidebarBrand({
  href,
  brand,
  locale,
}: {
  href: string;
  brand: BrandPublic;
  locale: string;
}) {
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");
  const tagline = taglineForLocale(brand, locale);
  return (
    <Link href={href} className="flex flex-col items-center px-5 pb-3 pt-5">
      <Image
        src={brand.logoPath}
        alt={brand.logoAlt || brand.name}
        width={128}
        height={128}
        unoptimized={bypassLogoOptimizer}
        className="h-32 w-32 rounded-3xl bg-[var(--color-background)] object-contain p-1 ring-1 ring-[var(--color-border)]"
      />
      <span className="mt-2.5 text-center font-display text-3xl font-bold leading-tight tracking-tight text-[var(--color-primary)]">
        {brand.name}
      </span>
      {tagline ? (
        <span className="mt-1 line-clamp-2 text-center text-xs leading-snug text-[var(--color-muted-foreground)]">
          {tagline}
        </span>
      ) : null}
    </Link>
  );
}
