import type { ReactNode } from "react";
import { PublicFlowFrame } from "@/components/organisms/PublicFlowFrame";

interface EncuestaLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function EncuestaLayout({ children, params }: EncuestaLayoutProps) {
  const { locale } = await params;
  return <PublicFlowFrame locale={locale}>{children}</PublicFlowFrame>;
}
