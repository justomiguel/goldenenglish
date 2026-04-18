import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Legacy entry — the (legacy) monthly payment review queue moved into the
 * unified Finance hub as the `payments` tab. We keep the route alive only
 * to 308-redirect bookmarks and stale links.
 */
export default async function AdminPaymentsRedirect({ params }: PageProps) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/dashboard/admin/finance?tab=payments`);
}
