import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { loadStudentBadgeDisplayRows } from "@/lib/badges/loadStudentBadgeDisplayRows";
import { StudentBadgesEntry } from "@/components/student/StudentBadgesEntry";
import { StudentBadgesScreen } from "@/components/student/StudentBadgesScreen";
import type { Locale } from "@/types/i18n";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentBadgesPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const rows = await loadStudentBadgeDisplayRows(user.id, (token) => {
    const u = absoluteUrl(`/${locale}/b/${token}`);
    return u ? u.toString() : "";
  });

  return (
    <StudentBadgesEntry>
      <StudentBadgesScreen
        locale={locale as Locale}
        rows={rows}
        dict={dict.dashboard.student.badges}
      />
    </StudentBadgesEntry>
  );
}
