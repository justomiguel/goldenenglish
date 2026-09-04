"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatShopMoney } from "@/lib/shop/formatShopMoney";
import type { PublicProductDetail } from "@/lib/shop/mapPublicCatalog";

export type PublicShopProductLabels = {
  back: string;
  size: string;
  color: string;
  price: string;
  soldOut: string;
  buy: string;
  unavailable: string;
};

interface PublicShopProductProps {
  locale: string;
  currency: string;
  product: PublicProductDetail;
  labels: PublicShopProductLabels;
}

const buyClass =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:cursor-not-allowed disabled:opacity-60";

export function PublicShopProduct({ locale, currency, product, labels }: PublicShopProductProps) {
  const initialId =
    product.variants.find((variant) => variant.stock > 0)?.id ?? product.variants[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(initialId);
  const selected = useMemo(
    () => product.variants.find((variant) => variant.id === selectedId) ?? product.variants[0],
    [product.variants, selectedId],
  );
  const canBuy = Boolean(selected && selected.stock > 0);
  const checkoutHref = `/${locale}/tienda/checkout?variantId=${selected?.id ?? ""}`;

  return (
    <main className="space-y-6">
      <Link
        href={`/${locale}/tienda`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)]"
      >
        {labels.back}
      </Link>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--color-muted)]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : null}
        </div>
        <div className="space-y-4">
          <header className="space-y-2">
            <h1 className="font-display text-3xl font-semibold text-[var(--color-foreground)]">
              {product.title}
            </h1>
            {product.description ? (
              <p className="text-[var(--color-muted-foreground)]">{product.description}</p>
            ) : null}
          </header>
          {product.variants.length > 0 ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-[var(--color-foreground)]">
                {labels.size} / {labels.color}
              </legend>
              <div className="grid gap-2">
                {product.variants.map((variant) => {
                  const option = `${variant.size} · ${variant.color}`;
                  return (
                    <label
                      key={variant.id}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                    >
                      <input
                        type="radio"
                        name="variant"
                        value={variant.id}
                        checked={selected?.id === variant.id}
                        onChange={() => setSelectedId(variant.id)}
                      />
                      <span className="flex-1">
                        {option}
                        {variant.stock === 0 ? ` · ${labels.soldOut}` : ""}
                      </span>
                      <span>{formatShopMoney(variant.price, currency, locale)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          {selected ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {labels.price}: {formatShopMoney(selected.price, currency, locale)}
            </p>
          ) : null}
          {canBuy ? (
            <Link href={checkoutHref} className={buyClass}>
              {labels.buy}
            </Link>
          ) : (
            <div className="space-y-2">
              <button type="button" className={buyClass} disabled>
                {labels.buy}
              </button>
              <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
                {labels.unavailable}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
