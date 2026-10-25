import type { ReactNode } from "react";
import { PublicFlowFrame } from "@/components/organisms/PublicFlowFrame";

interface ClasePruebaLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ClasePruebaLayout({ children, params }: ClasePruebaLayoutProps) {
  const { locale } = await params;
  return <PublicFlowFrame locale={locale}>{children}</PublicFlowFrame>;
}
