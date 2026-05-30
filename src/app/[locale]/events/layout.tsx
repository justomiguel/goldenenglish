import type { ReactNode } from "react";
import { PublicBlogPageShell } from "@/components/organisms/PublicBlogPageShell";

interface EventsLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/** Reuses tenant marketing chrome (same as public blog). */
export default async function EventsLayout({ children, params }: EventsLayoutProps) {
  const { locale } = await params;

  return <PublicBlogPageShell locale={locale}>{children}</PublicBlogPageShell>;
}
