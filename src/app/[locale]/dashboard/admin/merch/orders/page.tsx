import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { loadAdminShopOrders, loadAdminShopStudentOptions } from "@/lib/shop/loadAdminShopOrders";
import { AdminMerchOrdersEntry } from "@/components/dashboard/admin/merch/AdminMerchOrdersEntry";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminMerchOrdersPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { status } = await searchParams;
  let supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"];
  try {
    ({ supabase } = await assertAdmin());
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (msg === ADMIN_SESSION_FORBIDDEN) redirect(`/${locale}/dashboard`);
    throw err;
  }

  const dict = await getDictionary(locale);
  const statusFilter = status?.trim() || "all";
  const [rows, students] = await Promise.all([
    loadAdminShopOrders({ supabase, status: statusFilter === "all" ? null : statusFilter }),
    loadAdminShopStudentOptions(supabase),
  ]);

  return (
    <AdminMerchOrdersEntry
      locale={locale}
      statusFilter={statusFilter}
      rows={rows}
      students={students}
      labels={dict.admin.merch}
      statusLabels={dict.shop.order.status}
    />
  );
}
