import type { ReactNode } from "react";
import { PublicFlowFrame } from "@/components/organisms/PublicFlowFrame";

interface MatriculaLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function MatriculaLayout({ children, params }: MatriculaLayoutProps) {
  const { locale } = await params;
  return <PublicFlowFrame locale={locale}>{children}</PublicFlowFrame>;
}
