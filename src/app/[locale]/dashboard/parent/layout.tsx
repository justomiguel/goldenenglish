import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { PortalShell } from "@/components/portal/PortalShell";
import { buildParentShellConfig } from "@/lib/portal/buildParentShellConfig";
import { loadParentFocusCatalog } from "@/lib/parent/loadParentFocusCatalog";
import { resolveParentFocus } from "@/lib/parent/resolveParentFocus";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ParentDashboardLayout({
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
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") redirect(`/${locale}/dashboard`);

  const focusCatalog = await loadParentFocusCatalog(supabase, user.id);
  // Layouts cannot read `searchParams`; the shell only needs a default, and the
  // chips reconcile against the URL on the client.
  const defaultFocus = resolveParentFocus(focusCatalog, {
    studentId: null,
    sectionId: null,
  });

  const config = buildParentShellConfig({
    locale,
    baseHref: `/${locale}/dashboard/parent`,
    dict,
    includePayments: true,
    focusCatalog,
    activeStudentId: defaultFocus.studentId,
    activeSectionId: defaultFocus.sectionId,
  });

  return (
    <PortalShell locale={locale} dict={dict} brand={brand} config={config}>
      {children}
    </PortalShell>
  );
}
