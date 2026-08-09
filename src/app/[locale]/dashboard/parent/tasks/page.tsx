import { redirect } from "next/navigation";
import { parentRedirectPath } from "@/lib/parent/parentLegacyRedirect";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string }>;
}

export default async function ParentTasksRedirectPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  redirect(parentRedirectPath(locale, "/child/tasks", sp));
}
