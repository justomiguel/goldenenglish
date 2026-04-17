import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

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

  const base = `/${locale}/dashboard/parent`;

  return (
    <div className="min-h-screen bg-[var(--color-muted)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 md:px-6">
        <div className="mx-auto flex max-w-[var(--layout-max-width)] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav
            aria-label={dict.dashboard.parent.navAria}
            className="flex flex-wrap gap-2"
          >
            <Link
              href={base}
              className="rounded-[var(--layout-border-radius)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
            >
              {dict.dashboard.parent.navHome}
            </Link>
            <Link
              href={`${base}/calendar`}
              className="rounded-[var(--layout-border-radius)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
            >
              {dict.dashboard.parent.navCalendar}
            </Link>
            <Link
              href={`${base}/messages`}
              className="rounded-[var(--layout-border-radius)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
            >
              {dict.dashboard.parent.navMessages}
            </Link>
            <Link
              href={`${base}/payments`}
              className="rounded-[var(--layout-border-radius)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
            >
              {dict.dashboard.parent.navPay}
            </Link>
            <Link
              href={`${base}/billing`}
              className="rounded-[var(--layout-border-radius)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
            >
              {dict.dashboard.parent.navBilling}
            </Link>
            <Link
              href={`/${locale}/dashboard/profile`}
              className="rounded-[var(--layout-border-radius)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
            >
              {dict.dashboard.parent.navProfile}
            </Link>
          </nav>
          <LanguageSwitcher locale={locale} labels={dict.common.locale} />
        </div>
      </header>
      <div className="mx-auto max-w-[var(--layout-max-width)] px-3 py-8 md:px-6">
        {children}
      </div>
    </div>
  );
}
