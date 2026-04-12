import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ParentProfileRedirect({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/profile`);
}
