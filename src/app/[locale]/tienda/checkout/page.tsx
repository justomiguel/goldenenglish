import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadShopCheckoutPreview } from "@/lib/shop/loadShopCheckoutPreview";
import { ShopCheckoutForm } from "@/components/shop/ShopCheckoutForm";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ variantId?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return { title: dict.shop.checkout.title, robots: { index: false, follow: false } };
}

export default async function ShopCheckoutPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { variantId = "" } = await searchParams;
  const [dict, preview] = await Promise.all([
    getDictionary(locale),
    loadShopCheckoutPreview(locale, variantId),
  ]);
  if (!preview.line) notFound();

  return (
    <ShopCheckoutForm
      locale={locale}
      requireEmail={preview.session.requireEmail}
      studentForbidden={preview.session.role === "student"}
      gateways={preview.gateways}
      line={preview.line}
      labels={{
        title: dict.shop.checkout.title,
        pickup: dict.shop.checkout.pickup,
        email: dict.shop.checkout.email,
        emailHint: dict.shop.checkout.emailHint,
        payFlow: dict.shop.checkout.payFlow,
        payMercadoPago: dict.shop.checkout.payMercadoPago,
        noGateway: dict.shop.checkout.noGateway,
        studentForbidden: dict.shop.checkout.studentForbidden,
        error: dict.shop.checkout.error,
      }}
    />
  );
}
