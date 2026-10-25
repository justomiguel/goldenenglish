import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { PortalShell } from "@/components/portal/PortalShell";
import { PublicTenantChrome } from "@/components/organisms/PublicTenantChrome";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { buildParentShellConfig } from "@/lib/portal/buildParentShellConfig";
import { loadParentFocusCatalog } from "@/lib/parent/loadParentFocusCatalog";
import { resolveParentFocus } from "@/lib/parent/resolveParentFocus";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import { getDashboardActor, syncViewAsCookie } from "@/lib/dashboard/getDashboardActor";
import { filterAccountItemsForViewAs, viewAsPortalRedirect } from "@/lib/dashboard/viewAsLayout";

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
    .maybeSingle();
  const actor = await getDashboardActor();
  if (actor) await syncViewAsCookie(actor);
  const redirectTo = actor
    ? viewAsPortalRedirect(locale, actor, "parent", {
        sessionProfileRole: profile?.role ?? null,
        teacherPortalAllowed: false,
        assistantPortalAllowed: false,
      })
    : `/${locale}/dashboard`;
  if (redirectTo) redirect(redirectTo);

  const viewerId = actor?.viewerId ?? user.id;
  const [focusCatalog, includeShopNav, snapshot] = await Promise.all([
    loadParentFocusCatalog(supabase, viewerId),
    loadMerchEnabled(),
    loadActiveTheme(),
  ]);
  const templateKind = snapshot?.theme.templateKind ?? "classic";
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
    includeShopNav,
    focusCatalog,
    activeStudentId: defaultFocus.studentId,
    activeSectionId: defaultFocus.sectionId,
  });

  return (
    <PublicTenantChrome templateKind={templateKind}>
      <PortalShell
        locale={locale}
        dict={dict}
        brand={brand}
        config={{
          ...config,
          accountItems: filterAccountItemsForViewAs(config.accountItems, actor?.viewAs ?? null),
        }}
        viewAs={actor?.viewAs ?? null}
      >
        {children}
      </PortalShell>
    </PublicTenantChrome>
  );
}
