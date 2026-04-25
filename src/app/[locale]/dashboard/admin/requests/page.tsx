import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Transfer inbox is shown per cohort under Academic hub → cohort → Transfer inbox tab. */
export default async function AdminTransferRequestsRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/admin/academic`);
}
