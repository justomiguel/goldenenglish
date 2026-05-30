import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { PublicBlogPageShell } from "@/components/organisms/PublicBlogPageShell";

interface BlogLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function BlogLayout({ children, params }: BlogLayoutProps) {
  const { locale } = await params;
  const enabled = await loadBlogEnabled();
  if (!enabled) notFound();

  return <PublicBlogPageShell locale={locale}>{children}</PublicBlogPageShell>;
}
