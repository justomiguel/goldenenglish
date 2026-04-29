import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { isStudentBadgeCode } from "@/lib/badges/badgeCodes";
import { loadActiveBadgeCatalog } from "@/lib/badges/loadBadgeCatalog";
import { badgeImagePublicUrl } from "@/lib/badges/badgeImagePublicUrl";
import type { BadgeCatalogEntry } from "@/lib/badges/badgeCatalog";
import { StudentBadgesEntry } from "@/components/student/StudentBadgesEntry";
import {
  StudentBadgesScreen,
  type StudentBadgeRowModel,
} from "@/components/student/StudentBadgesScreen";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

function buildCatalogIndex(catalog: BadgeCatalogEntry[]) {
  const byCode = new Map<string, BadgeCatalogEntry>();
  for (const entry of catalog) byCode.set(entry.code, entry);
  return byCode;
}

export default async function StudentBadgesPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const [grants, catalog] = await Promise.all([
    supabase
      .from("student_badge_grants")
      .select("id, badge_code, earned_at, public_share_token")
      .eq("student_id", user.id)
      .order("earned_at", { ascending: false }),
    loadActiveBadgeCatalog(),
  ]);
  if (grants.error) {
    logSupabaseClientError("StudentBadgesPage:select", grants.error, { userId: user.id });
  }
  const byCode = buildCatalogIndex(catalog);
  const rows: StudentBadgeRowModel[] = [];
  for (const r of grants.data ?? []) {
    const code = (r as { badge_code: string }).badge_code;
    if (!isStudentBadgeCode(code)) continue;
    const token = String((r as { public_share_token: string }).public_share_token);
    const u = absoluteUrl(`/${locale}/b/${token}`);
    const catalogEntry = byCode.get(code) ?? null;
    rows.push({
      id: (r as { id: string }).id,
      badgeCode: code,
      earnedAt: (r as { earned_at: string }).earned_at,
      shareUrl: u ? u.toString() : "",
      catalog: catalogEntry
        ? {
            category: catalogEntry.category,
            imageUrl: badgeImagePublicUrl(catalogEntry.imagePath),
            translations: catalogEntry.translations,
          }
        : undefined,
    });
  }
  return (
    <StudentBadgesEntry>
      <StudentBadgesScreen locale={locale} rows={rows} dict={dict.dashboard.student.badges} />
    </StudentBadgesEntry>
  );
}
