import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { loadAdminSectionCollectionsView } from "@/lib/billing/loadAdminSectionCollectionsView";
import { SectionCollectionsClient } from "@/components/dashboard/admin/finance/SectionCollectionsClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
  searchParams: Promise<{ year?: string }>;
}

function parseYear(input: string | undefined, fallback: number): number {
  if (!input) return fallback;
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n) || n < 2000 || n > 2100) return fallback;
  return n;
}

export default async function AdminCollectionsSectionPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, sectionId } = await params;
  const search = await searchParams;
  const dict = await getDictionary(locale);
  const d = dict.admin.finance.collections;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const today = new Date();
  const todayYear = today.getFullYear();
  const year = parseYear(search.year, todayYear);

  const view = await loadAdminSectionCollectionsView(supabase, sectionId, {
    todayYear: year,
    todayMonth: year === todayYear ? today.getMonth() + 1 : 12,
  });
  if (!view) notFound();

  const overviewHref = `/${locale}/dashboard/admin/finance/collections?cohort=${view.cohortId}&year=${year}`;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-5">
        <Link
          href={overviewHref}
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden />
          {d.matrix.back}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {view.sectionName}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {view.cohortName} · {year}
        </p>
      </header>
      <SectionCollectionsClient view={view} dict={d} locale={locale} />
    </div>
  );
}
