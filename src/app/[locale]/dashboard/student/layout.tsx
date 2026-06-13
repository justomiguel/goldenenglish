import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { ParentDashboardShell } from "@/components/dashboard/ParentDashboardShell";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function StudentDashboardLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const brand = await getBrandForRequest();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/student`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") redirect(`/${locale}/dashboard`);

  const perms = await getProfilePermissions(supabase, user.id);
  const includePayments = perms?.canAccessPaymentsModule ?? false;
  const baseHref = `/${locale}/dashboard/student`;

  return (
    <ParentDashboardShell
      locale={locale}
      dict={dict}
      brand={brand}
      baseHref={baseHref}
      includePayments={includePayments}
    >
      {children}
    </ParentDashboardShell>
  );
}
