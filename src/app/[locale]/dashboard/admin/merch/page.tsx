import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";
import { shopProductImagePublicUrl } from "@/lib/shop/shopMedia";
import { AdminMerchEntry } from "@/components/dashboard/admin/merch/AdminMerchEntry";
import type { AdminMerchProductRow } from "@/components/dashboard/admin/merch/adminMerchTypes";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

type VariantRow = {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price: number;
  active: boolean;
};

export default async function AdminMerchPage({ params }: PageProps) {
  const { locale } = await params;
  try {
    await assertAdmin();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (msg === ADMIN_SESSION_FORBIDDEN) redirect(`/${locale}/dashboard`);
    throw err;
  }

  const [dict, supabase, { url: supabaseUrl }] = await Promise.all([
    getDictionary(locale),
    createClient(),
    readRequestSupabasePublicEnv(),
  ]);
  const { data: rows } = await supabase
    .from("shop_products")
    .select(
      "id, title, description, image_path, active, sort_order, shop_product_variants(id, size, color, sku, stock, price, active)",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const list: AdminMerchProductRow[] = (rows ?? []).map((r) => {
    const variants = ((r.shop_product_variants ?? []) as VariantRow[]).map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      sku: v.sku,
      stock: Number(v.stock),
      price: Number(v.price),
      active: Boolean(v.active),
    }));
    return {
      id: r.id as string,
      title: r.title as string,
      description: (r.description as string) ?? "",
      imagePath: (r.image_path as string | null) ?? null,
      imageUrl: shopProductImagePublicUrl(r.image_path as string | null, supabaseUrl),
      active: Boolean(r.active),
      sortOrder: Number(r.sort_order ?? 0),
      variants,
    };
  });

  return (
    <AdminMerchEntry
      locale={locale}
      initialRows={list}
      labels={dict.admin.merch}
      fileUploadProgress={dict.common.fileUpload}
    />
  );
}
