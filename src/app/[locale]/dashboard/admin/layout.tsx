import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { AdminDashboardShell } from "@/components/dashboard/AdminDashboardShell";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminSectionLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard/admin`);
  }

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) {
    redirect(`/${locale}`);
  }

  const { count } = await supabase
    .from("registrations")
    .select("id", { head: true, count: "exact" })
    .eq("status", "new");

  const brand = getBrandPublic();

  return (
    <AdminDashboardShell
      locale={locale}
      dict={dict}
      brand={brand}
      newRegistrationsCount={count ?? 0}
    >
      {children}
    </AdminDashboardShell>
  );
}
