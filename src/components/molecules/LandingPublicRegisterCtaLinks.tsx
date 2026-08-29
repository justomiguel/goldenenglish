import Link from "next/link";
import type { PublicRegisterCtaItem } from "@/lib/settings/publicRegisterCtaItems";

export function LandingPublicRegisterCtaLinks({
  items,
  className,
  linkClassName,
}: {
  items: PublicRegisterCtaItem[];
  className?: string;
  linkClassName?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={className}>
      {items.map((item) => (
        <Link key={item.intent} href={item.href} className={linkClassName}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}
