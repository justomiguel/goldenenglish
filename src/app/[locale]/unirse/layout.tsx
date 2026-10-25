import type { ReactNode } from "react";
import { PublicFlowFrame } from "@/components/organisms/PublicFlowFrame";

interface UnirseLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function UnirseLayout({ children, params }: UnirseLayoutProps) {
  const { locale } = await params;
  return <PublicFlowFrame locale={locale}>{children}</PublicFlowFrame>;
}
