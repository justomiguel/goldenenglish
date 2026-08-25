import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { resolveStaffAssistantPortal } from "@/lib/dashboard/resolveStaffAssistantPortal";
import { AssistantDashboardShell } from "@/components/dashboard/AssistantDashboardShell";
import { formatProfileSnakeGivenFirst } from "@/lib/profile/formatProfileDisplayName";
import { resolveAvatarDisplayUrl } from "@/lib/dashboard/resolveAvatarUrl";
import { getDashboardActor, syncViewAsCookie } from "@/lib/dashboard/getDashboardActor";
import { viewAsPortalRedirect } from "@/lib/dashboard/viewAsLayout";

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

  const actor = await getDashboardActor();
  if (actor) await syncViewAsCookie(actor);
  const ok = await resolveStaffAssistantPortal(supabase, user.id);
  const redirectTo = actor
    ? viewAsPortalRedirect(locale, actor, "assistant", {
        sessionProfileRole: null,
        teacherPortalAllowed: false,
        assistantPortalAllowed: ok,
      })
    : `/${locale}/dashboard`;
  if (redirectTo) redirect(redirectTo);

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const profileDisplayName = formatProfileSnakeGivenFirst({
    first_name: profile?.first_name,
    last_name: profile?.last_name,
  });
  const profileAvatarUrl = await resolveAvatarDisplayUrl(supabase, profile?.avatar_url);

  return (
    <AssistantDashboardShell
      locale={locale}
      dict={dict}
      brand={brand}
      profileDisplayName={profileDisplayName}
      profileAvatarUrl={profileAvatarUrl}
      viewAs={actor?.viewAs ?? null}
    >
      {children}
    </AssistantDashboardShell>
  );
}
