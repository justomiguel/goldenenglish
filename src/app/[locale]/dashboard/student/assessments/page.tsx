import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentAssessmentsRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/student/progress?tab=assessments`);
}
