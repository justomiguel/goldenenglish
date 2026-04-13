import { permanentRedirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LegacyAdminAcademicsRedirect({ params }: PageProps) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/dashboard/admin/academic`);
}
