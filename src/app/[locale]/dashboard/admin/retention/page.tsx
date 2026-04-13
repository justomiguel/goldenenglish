import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getBrandPublic } from "@/lib/brand/server";
import { loadAdminRetentionCandidates } from "@/lib/academics/loadAdminRetentionCandidates";
import { AdminRetentionTable } from "@/components/organisms/AdminRetentionTable";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.adminRetention.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminRetentionPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.adminRetention;
  let rows: Awaited<ReturnType<typeof loadAdminRetentionCandidates>> = [];
  try {
    const { supabase } = await assertAdmin();
    rows = await loadAdminRetentionCandidates(supabase);
  } catch {
    redirect(`/${locale}/dashboard`);
  }

  const brand = getBrandPublic();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{d.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-foreground)]">{d.lead}</p>
      </div>
      <AdminRetentionTable locale={locale} brandAppName={brand.name} rows={rows} dict={d} />
    </div>
  );
}
