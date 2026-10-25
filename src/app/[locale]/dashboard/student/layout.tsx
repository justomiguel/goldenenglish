import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { PortalShell } from "@/components/portal/PortalShell";
import { PublicTenantChrome } from "@/components/organisms/PublicTenantChrome";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { buildStudentShellConfig } from "@/lib/portal/buildStudentShellConfig";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import { getDashboardActor, syncViewAsCookie } from "@/lib/dashboard/getDashboardActor";
import { filterAccountItemsForViewAs, viewAsPortalRedirect } from "@/lib/dashboard/viewAsLayout";

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
    .maybeSingle();
  const actor = await getDashboardActor();
  if (actor) await syncViewAsCookie(actor);
  const redirectTo = actor
    ? viewAsPortalRedirect(locale, actor, "student", {
        sessionProfileRole: profile?.role ?? null,
        teacherPortalAllowed: false,
        assistantPortalAllowed: false,
      })
    : `/${locale}/dashboard`;
  if (redirectTo) redirect(redirectTo);

  const viewerId = actor?.viewerId ?? user.id;
  const [perms, includeShopNav, snapshot] = await Promise.all([
    getProfilePermissions(supabase, viewerId),
    loadMerchEnabled(),
    loadActiveTheme(),
  ]);
  const templateKind = snapshot?.theme.templateKind ?? "classic";
  const config = buildStudentShellConfig({
    locale,
    baseHref: `/${locale}/dashboard/student`,
    dict,
    includePayments: perms?.canAccessPaymentsModule ?? false,
    includeShopNav,
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
