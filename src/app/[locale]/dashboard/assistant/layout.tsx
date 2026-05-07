import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { resolveStaffAssistantPortal } from "@/lib/dashboard/resolveStaffAssistantPortal";
import { AssistantDashboardShell } from "@/components/dashboard/AssistantDashboardShell";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AssistantDashboardLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const brand = await getBrandForRequest();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/assistant`);

  const ok = await resolveStaffAssistantPortal(supabase, user.id);
  if (!ok) redirect(`/${locale}/dashboard`);

  return (
    <AssistantDashboardShell locale={locale} dict={dict} brand={brand}>
      {children}
    </AssistantDashboardShell>
  );
}
