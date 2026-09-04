import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import type { Dictionary } from "@/types/i18n";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireShopPortal(
  locale: string,
  role: "parent" | "student",
): Promise<{ dict: Dictionary; supabase: SupabaseClient; user: { id: string } }> {
  if (!(await loadMerchEnabled())) notFound();
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const next =
    role === "parent"
      ? `/${locale}/dashboard/parent/shop`
      : `/${locale}/dashboard/student/shop/orders`;
  if (!user) redirect(`/${locale}/login?next=${next}`);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== role) redirect(`/${locale}/dashboard`);
  return { dict, supabase, user };
}
