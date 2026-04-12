import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminCouponsEntry } from "@/components/dashboard/AdminCouponsEntry";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminCouponsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("discount_coupons")
    .select(
      "id, code, discount_type, discount_value, valid_from, valid_until, max_uses, uses_count, is_active, created_at",
    )
    .order("created_at", { ascending: false });

  const list = (rows ?? []).map((r) => ({
    id: r.id as string,
    code: r.code as string,
    discount_type: r.discount_type as string,
    discount_value: Number(r.discount_value),
    valid_from: r.valid_from as string,
    valid_until: (r.valid_until as string | null) ?? null,
    max_uses: r.max_uses != null ? Number(r.max_uses) : null,
    uses_count: Number(r.uses_count ?? 0),
    is_active: Boolean(r.is_active),
  }));

  return (
    <AdminCouponsEntry locale={locale} initialRows={list} labels={dict.admin.coupons} />
  );
}
