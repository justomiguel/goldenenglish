import { permanentRedirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
}

export default async function DeprecatedGradesPage({ params }: PageProps) {
  const { locale, sectionId } = await params;
  permanentRedirect(
    `/${locale}/dashboard/teacher/sections/${sectionId}/assessments`,
  );
}
