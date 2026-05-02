import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** CMS entry reuses the templates index — avoids an extra hub with a single CTA. */
export default async function AdminCmsHubPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/admin/cms/templates`);
}
