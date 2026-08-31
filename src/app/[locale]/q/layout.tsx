import type { ReactNode } from "react";
import { PublicBlogPageShell } from "@/components/organisms/PublicBlogPageShell";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function QuestionnairesLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  return <PublicBlogPageShell locale={locale}>{children}</PublicBlogPageShell>;
}
