import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { isStudentBadgeCode } from "@/lib/badges/badgeCodes";
import type { StudentBadgeCode } from "@/lib/badges/badgeCodes";
import { StudentBadgesEntry } from "@/components/student/StudentBadgesEntry";
import { StudentBadgesScreen, type StudentBadgeRowModel } from "@/components/student/StudentBadgesScreen";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

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

  const { data, error } = await supabase
    .from("student_badge_grants")
    .select("id, badge_code, earned_at, public_share_token")
    .eq("student_id", user.id)
    .order("earned_at", { ascending: false });
  if (error) {
    logSupabaseClientError("StudentBadgesPage:select", error, { userId: user.id });
  }
  const rows: StudentBadgeRowModel[] = [];
  for (const r of data ?? []) {
    const code = (r as { badge_code: string }).badge_code;
    if (!isStudentBadgeCode(code)) continue;
    const token = String((r as { public_share_token: string }).public_share_token);
    const u = absoluteUrl(`/${locale}/b/${token}`);
    rows.push({
      id: (r as { id: string }).id,
      badgeCode: code as StudentBadgeCode,
      earnedAt: (r as { earned_at: string }).earned_at,
      shareUrl: u ? u.toString() : "",
    });
  }
  return (
    <StudentBadgesEntry>
      <StudentBadgesScreen locale={locale} rows={rows} dict={dict.dashboard.student.badges} />
    </StudentBadgesEntry>
  );
}
