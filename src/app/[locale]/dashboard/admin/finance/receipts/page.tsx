import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Legacy entry — the invoice receipts review queue moved into the
 * unified Finance hub. The per-receipt review screen
 * (`/admin/finance/receipts/[receiptId]`) stays alive and is linked from
 * the receipts tab.
 */
export default async function AdminFinanceReceiptsRedirect({ params }: PageProps) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/dashboard/admin/finance?tab=receipts`);
}
