import Link from "next/link";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["shop"]["family"];

export function FamilyShopNav({
  locale,
  labels,
  current,
}: {
  locale: string;
  labels: Labels;
  current: "catalog" | "orders";
}) {
  const base = `/${locale}/dashboard/parent/shop`;
  const tab = (href: string, active: boolean, text: string) => (
    <Link
      href={href}
      className={`text-sm font-semibold ${
        active ? "text-[var(--color-foreground)]" : "text-[var(--color-primary)]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {text}
    </Link>
  );
  return (
    <nav className="flex gap-4" aria-label={labels.ordersTitle}>
      {tab(base, current === "catalog", labels.catalogLink)}
      {tab(`${base}/orders`, current === "orders", labels.ordersLink)}
    </nav>
  );
}
