import Link from "next/link";
import type { PublicRegisterCtaItem } from "@/lib/settings/publicRegisterCtaItems";

export function NagoRegisterCtaButtons({
  items,
  className = "flex flex-col gap-3 sm:flex-row",
  compact = false,
  onItemClick,
  tabIndex,
}: {
  items: PublicRegisterCtaItem[];
  className?: string;
  compact?: boolean;
  onItemClick?: () => void;
  tabIndex?: number;
}) {
  if (items.length === 0) return null;
  const pad = compact ? " px-3 py-2 text-[10px] lg:px-4" : "";
  return (
    <div className={className}>
      {items.map((cta, index) => (
        <Link
          key={cta.intent}
          href={cta.href}
          className={`nago-btn${index === 0 ? " nago-btn-solid" : ""}${pad}`}
          onClick={onItemClick}
          tabIndex={tabIndex}
        >
          {cta.label}
        </Link>
      ))}
    </div>
  );
}
