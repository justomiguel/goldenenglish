import { redirect } from "next/navigation";
import { parentRedirectPath } from "@/lib/parent/parentLegacyRedirect";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string }>;
}

/** Settings held a single language switcher; it lives in the account sheet now. */
export default async function ParentSettingsRedirectPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  redirect(parentRedirectPath(locale, "/account", sp));
}
