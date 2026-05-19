import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { isStudentBadgeCode } from "@/lib/badges/badgeCodes";
import { loadActiveBadgeCatalog } from "@/lib/badges/loadBadgeCatalog";
import { badgeImagePublicUrl } from "@/lib/badges/badgeImagePublicUrl";
import type { BadgeCatalogEntry } from "@/lib/badges/badgeCatalog";
import { listTutorStudentsWithFinance } from "@/lib/auth/listTutorStudentsWithFinance";
import { resolveSelectedWard } from "@/lib/parent/resolveSelectedWard";
import { loadStudentLearningTasks } from "@/lib/learning-tasks/loadStudentLearningTasks";
import { loadStudentMiniTests } from "@/lib/learning-content/loadStudentMiniTests";
import { loadParentLearningFeedback } from "@/lib/learning-content/loadParentLearningFeedback";
import { ParentProgressEntry } from "@/components/parent/ParentProgressEntry";
import type { StudentBadgeRowModel } from "@/components/student/StudentBadgesScreen";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; tab?: string }>;
}

function buildCatalogIndex(catalog: BadgeCatalogEntry[]) {
  const byCode = new Map<string, BadgeCatalogEntry>();
  for (const entry of catalog) byCode.set(entry.code, entry);
  return byCode;
}

function ProgressFallback() {
  return <div className="h-40 animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" aria-hidden />;
}

export default async function ParentProgressPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent/progress`);

  const students = await listTutorStudentsWithFinance(supabase, user.id);
  const selectedStudentId = resolveSelectedWard(
    students,
    typeof sp.studentId === "string" ? sp.studentId : undefined,
  );

  const wardOptions = students.map((s) => ({
    studentId: s.studentId,
    displayName: s.displayName,
  }));

  const [tasks, assessments, feedback, badgeRows] = await Promise.all([
    selectedStudentId ? loadStudentLearningTasks(supabase, selectedStudentId, 40) : Promise.resolve([]),
    selectedStudentId ? loadStudentMiniTests(supabase, selectedStudentId) : Promise.resolve([]),
    loadParentLearningFeedback(supabase, user.id),
    loadParentBadgeRows(supabase, user.id, selectedStudentId, locale),
  ]);

  return (
    <Suspense fallback={<ProgressFallback />}>
      <ParentProgressEntry
        locale={locale}
        wardOptions={wardOptions}
        selectedStudentId={selectedStudentId}
        tasks={tasks}
        assessments={assessments}
        feedback={feedback}
        badgeRows={badgeRows}
        parentLabels={dict.dashboard.parent}
        studentLabels={dict.dashboard.student}
        badgesDict={dict.dashboard.student.badges}
        navDict={dict.dashboard.parentNav}
      />
    </Suspense>
  );
}

async function loadParentBadgeRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tutorId: string,
  selectedStudentId: string | null,
  locale: string,
): Promise<StudentBadgeRowModel[]> {
  if (!selectedStudentId) return [];

  const [grants, catalog] = await Promise.all([
    supabase
      .from("student_badge_grants")
      .select("id, badge_code, earned_at, public_share_token")
      .eq("student_id", selectedStudentId)
      .order("earned_at", { ascending: false }),
    loadActiveBadgeCatalog(),
  ]);

  if (grants.error) {
    logSupabaseClientError("ParentProgressPage:badges", grants.error, {
      tutorId,
      studentId: selectedStudentId,
    });
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

  return rows;
}
