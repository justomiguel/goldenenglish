import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireShopPortal } from "@/lib/shop/requireShopPortal";
import { loadAssignedShopOrders } from "@/lib/shop/loadFamilyShopOrders";
import { FamilyShopOrdersScreen } from "@/components/shop/FamilyShopOrdersScreen";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return { title: dict.shop.family.ordersTitle };
}

export default async function StudentShopOrdersPage({ params }: PageProps) {
  const { locale } = await params;
  const { dict, supabase, user } = await requireShopPortal(locale, "student");
  const rows = await loadAssignedShopOrders(supabase, user.id);
  return (
    <FamilyShopOrdersScreen
      locale={locale}
      role="student"
      rows={rows}
      assignOptions={[]}
      family={dict.shop.family}
      order={dict.shop.order}
    />
  );
}
