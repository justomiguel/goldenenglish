import { redirect } from "next/navigation";
import { parentProgressRedirectPath } from "@/lib/parent/parentLegacyRedirect";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string; tab?: string }>;
}

/**
 * The Progress hub became `/parent/child` plus one route per section. Kept as a
 * temporary redirect: these are authenticated in-app addresses, and a 308 cached in a
 * parent's browser would outlive any future change to the information architecture.
 */
export default async function ParentProgressRedirectPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  redirect(parentProgressRedirectPath(locale, sp));
}
