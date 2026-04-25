import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Retention is shown per cohort under Academic hub → cohort → Retention tab. */
export default async function AdminRetentionRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/admin/academic`);
}
