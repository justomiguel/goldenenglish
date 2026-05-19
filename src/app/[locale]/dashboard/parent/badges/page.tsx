import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string }>;
}

export default async function ParentBadgesRedirectPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const query = new URLSearchParams({ tab: "badges" });
  if (typeof sp.studentId === "string") query.set("studentId", sp.studentId);
  redirect(`/${locale}/dashboard/parent/progress?${query.toString()}`);
}
