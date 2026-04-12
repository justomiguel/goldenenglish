import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Unified profile lives under `/dashboard/profile` for all roles. */
export default async function StudentProfileRedirect({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/profile`);
}
