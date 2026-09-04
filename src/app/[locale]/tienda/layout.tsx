import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import { PublicBlogPageShell } from "@/components/organisms/PublicBlogPageShell";

interface TiendaLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function TiendaLayout({ children, params }: TiendaLayoutProps) {
  const { locale } = await params;
  const enabled = await loadMerchEnabled();
  if (!enabled) notFound();

  return <PublicBlogPageShell locale={locale}>{children}</PublicBlogPageShell>;
}
