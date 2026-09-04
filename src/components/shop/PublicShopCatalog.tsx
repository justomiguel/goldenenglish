import Image from "next/image";
import Link from "next/link";
import type { PublicCatalogCard } from "@/lib/shop/mapPublicCatalog";

export type PublicShopCatalogLabels = {
  title: string;
  lead: string;
  empty: string;
  soldOut: string;
  viewProduct: string;
};

interface PublicShopCatalogProps {
  locale: string;
  rows: PublicCatalogCard[];
  labels: PublicShopCatalogLabels;
}

export function PublicShopCatalog({ locale, rows, labels }: PublicShopCatalogProps) {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h1>
        <p className="text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </header>
      {rows.length === 0 ? (
        <p
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]"
          role="status"
        >
          {labels.empty}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/${locale}/tienda/${row.id}`}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)] outline-none ring-[var(--color-primary)] transition hover:border-[var(--color-primary)]/40 focus-visible:ring-2"
              >
                <div className="relative aspect-[4/3] bg-[var(--color-muted)]">
                  {row.imageUrl ? (
                    <Image
                      src={row.imageUrl}
                      alt={row.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="font-display text-lg font-semibold text-[var(--color-foreground)]">
                    {row.title}
                  </h2>
                  {row.soldOut ? (
                    <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
                      {labels.soldOut}
                    </p>
                  ) : null}
                  <span className="mt-auto text-sm font-semibold text-[var(--color-primary)]">
                    {labels.viewProduct}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
