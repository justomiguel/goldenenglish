import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireShopPortal } from "@/lib/shop/requireShopPortal";
import { loadBuyerShopOrders, loadTutorShopChildren } from "@/lib/shop/loadFamilyShopOrders";
import { FamilyShopOrdersScreen } from "@/components/shop/FamilyShopOrdersScreen";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return { title: dict.shop.family.ordersTitle };
}

export default async function ParentShopOrdersPage({ params }: PageProps) {
  const { locale } = await params;
  const { dict, supabase, user } = await requireShopPortal(locale, "parent");
  const [rows, assignOptions] = await Promise.all([
    loadBuyerShopOrders(supabase, user.id),
    loadTutorShopChildren(supabase, user.id),
  ]);
  return (
    <FamilyShopOrdersScreen
      locale={locale}
      role="parent"
      rows={rows}
      assignOptions={assignOptions}
      family={dict.shop.family}
      order={dict.shop.order}
    />
  );
}
