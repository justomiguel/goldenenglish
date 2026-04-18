import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cohort?: string; year?: string }>;
}

/**
 * Legacy entry — the section-level collections dashboard moved into the
 * unified Finance hub. We preserve cohort/year filters via search params and
 * 308-redirect to `/admin/finance?tab=collections`.
 *
 * The drill-down route `/admin/finance/collections/[sectionId]` stays alive
 * (rendered by the sibling dynamic segment) because the overview tab links
 * to it for the per-student matrix.
 */
export default async function AdminFinanceCollectionsRedirect({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const search = await searchParams;
  const qs = new URLSearchParams();
  qs.set("tab", "collections");
  if (search.cohort) qs.set("cohort", search.cohort);
  if (search.year) qs.set("year", search.year);
  permanentRedirect(`/${locale}/dashboard/admin/finance?${qs.toString()}`);
}
