"use client";

import { useState, useTransition } from "react";
import { startShopCheckoutAction } from "@/app/[locale]/tienda/checkout/actions";
import type { ShopCheckoutGateway } from "@/lib/shop/types";
import type { ShopCheckoutPreviewLine } from "@/lib/shop/loadShopCheckoutPreview";

export type ShopCheckoutFormLabels = {
  title: string;
  pickup: string;
  email: string;
  emailHint: string;
  payFlow: string;
  payMercadoPago: string;
  noGateway: string;
  studentForbidden: string;
  error: string;
};

interface ShopCheckoutFormProps {
  locale: string;
  requireEmail: boolean;
  studentForbidden: boolean;
  gateways: ShopCheckoutGateway[];
  line: ShopCheckoutPreviewLine | null;
  labels: ShopCheckoutFormLabels;
}

const btnClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:cursor-not-allowed disabled:opacity-60";

export function ShopCheckoutForm({
  locale,
  requireEmail,
  studentForbidden,
  gateways,
  line,
  labels,
}: ShopCheckoutFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  function pay(gateway: ShopCheckoutGateway) {
    if (!line) return;
    setMessage("");
    start(async () => {
      const result = await startShopCheckoutAction({
        locale,
        gateway,
        email: requireEmail ? email : undefined,
        lines: [{ variantId: line.variantId, quantity: line.quantity }],
      });
      if (!result.ok) {
        setMessage(result.code === "student_forbidden" ? labels.studentForbidden : labels.error);
      }
    });
  }

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h1>
        <p className="text-[var(--color-muted-foreground)]">{labels.pickup}</p>
      </header>
      {line ? (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <p className="font-medium text-[var(--color-foreground)]">{line.title}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {line.size} · {line.color}
          </p>
          <p className="mt-2 text-sm font-semibold">{line.priceLabel}</p>
        </section>
      ) : null}
      {studentForbidden ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {labels.studentForbidden}
        </p>
      ) : (
        <>
          {requireEmail ? (
            <div className="space-y-2 text-sm">
              <label htmlFor="shop-checkout-email" className="font-semibold text-[var(--color-foreground)]">
                {labels.email}
              </label>
              <input
                id="shop-checkout-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-3 py-2"
              />
              <p className="text-[var(--color-muted-foreground)]">{labels.emailHint}</p>
            </div>
          ) : null}
          {gateways.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
              {labels.noGateway}
            </p>
          ) : (
            <div className="space-y-3">
              {gateways.includes("flow") ? (
                <button type="button" className={btnClass} disabled={pending} onClick={() => pay("flow")}>
                  {labels.payFlow}
                </button>
              ) : null}
              {gateways.includes("mercadopago") ? (
                <button
                  type="button"
                  className={btnClass}
                  disabled={pending}
                  onClick={() => pay("mercadopago")}
                >
                  {labels.payMercadoPago}
                </button>
              ) : null}
            </div>
          )}
        </>
      )}
      {message ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {message}
        </p>
      ) : null}
    </main>
  );
}
