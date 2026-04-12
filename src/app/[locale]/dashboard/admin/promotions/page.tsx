import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminPromotionsEntry } from "@/components/dashboard/AdminPromotionsEntry";
import type { AdminPromotionRow } from "@/components/dashboard/AdminPromotionsTable";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPromotionsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("promotions")
    .select(
      "id, code, name, discount_type, discount_value, applies_to, uses_count, max_uses, expires_at, is_stackable, is_active",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const list: AdminPromotionRow[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    discount_type: r.discount_type as string,
    discount_value: Number(r.discount_value),
    applies_to: r.applies_to as string,
    uses_count: Number(r.uses_count ?? 0),
    max_uses: r.max_uses != null ? Number(r.max_uses) : null,
    expires_at: (r.expires_at as string | null) ?? null,
    is_stackable: Boolean(r.is_stackable),
    is_active: Boolean(r.is_active),
  }));

  return (
    <AdminPromotionsEntry locale={locale} initialRows={list} labels={dict.admin.promotions} />
  );
}
