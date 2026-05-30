import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; id: string; targetLocale: string }>;
}

export default async function AdminBlogTranslationPage({ params }: PageProps) {
  const { locale, id } = await params;
  redirect(`/${locale}/dashboard/admin/cms/blog/${id}/edit`);
}
