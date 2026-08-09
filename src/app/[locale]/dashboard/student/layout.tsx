import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { PortalShell } from "@/components/portal/PortalShell";
import { buildStudentShellConfig } from "@/lib/portal/buildStudentShellConfig";

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
  const config = buildStudentShellConfig({
    locale,
    baseHref: `/${locale}/dashboard/student`,
    dict,
    includePayments: perms?.canAccessPaymentsModule ?? false,
  });

  return (
    <PortalShell locale={locale} dict={dict} brand={brand} config={config}>
      {children}
    </PortalShell>
  );
}
