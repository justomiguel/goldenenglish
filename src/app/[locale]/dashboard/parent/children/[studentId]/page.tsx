import { redirect } from "next/navigation";
import { parentRedirectPath } from "@/lib/parent/parentLegacyRedirect";

interface PageProps {
  params: Promise<{ locale: string; studentId: string }>;
  searchParams: Promise<{ sectionId?: string }>;
}

/** The ward form moved to `/parent/child/edit`, where the child comes from `?studentId`. */
export default async function ParentChildEditRedirectPage({ params, searchParams }: PageProps) {
  const { locale, studentId } = await params;
  const sp = await searchParams;
  redirect(parentRedirectPath(locale, "/child/edit", { studentId, sectionId: sp.sectionId }));
}
