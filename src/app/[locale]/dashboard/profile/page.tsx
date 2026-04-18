import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { resolveAvatarDisplayUrl } from "@/lib/dashboard/resolveAvatarUrl";
import { loadOrProvisionDashboardProfileRow } from "@/lib/profile/loadOrProvisionDashboardProfileRow";
import { listStudentTutorsWithFinance } from "@/lib/auth/listStudentTutorsWithFinance";
import { MyProfileSurfaceEntry } from "@/components/organisms/MyProfileSurfaceEntry";
import { ProfileMissingScreen } from "@/components/organisms/ProfileMissingScreen";
import type { TutorFinancialAccessRow } from "@/components/molecules/TutorFinancialAccessSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.myProfile.metaTitle,
    robots: { index: false, follow: false },
  };
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

function segmentForRole(role: string | undefined): string {
  if (role === "admin" || role === "teacher" || role === "student" || role === "parent") {
    return role;
  }
  return "student";
}

export default async function DashboardProfilePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard/profile`);
  }

  const resolvedProfile = await loadOrProvisionDashboardProfileRow(user);

  if (!resolvedProfile) {
    return (
      <ProfileMissingScreen locale={locale} brand={getBrandPublic()} labels={dict.dashboard.myProfile} />
    );
  }

  const profileSafe = resolvedProfile;
  const isMinor = Boolean("is_minor" in profileSafe ? profileSafe.is_minor : false);
  let minorPersonalLocked = false;
  if (profileSafe.role === "student" && isMinor) {
    const { count } = await supabase
      .from("tutor_student_rel")
      .select("student_id", { head: true, count: "exact" })
      .eq("student_id", user.id);
    minorPersonalLocked = (count ?? 0) > 0;
  }

  const avatarDisplayUrl = await resolveAvatarDisplayUrl(supabase, profileSafe.avatar_url);
  const displayName =
    `${profileSafe.first_name ?? ""} ${profileSafe.last_name ?? ""}`.trim() ||
    user.email?.split("@")[0] ||
    "?";

  const birthRaw = profileSafe.birth_date ? String(profileSafe.birth_date) : "";
  const birthDate = birthRaw.length >= 10 ? birthRaw.slice(0, 10) : "";

  const backHref = `/${locale}/dashboard/${segmentForRole(profileSafe.role ?? undefined)}`;

  let classReminder: {
    studentId: string;
    initial: Record<string, unknown> | null;
    studentLabels: (typeof dict)["dashboard"]["student"];
  } | null = null;
  if (profileSafe.role === "student" && !minorPersonalLocked) {
    const { data: crPref } = await supabase
      .from("class_reminder_channel_prefs")
      .select("*")
      .eq("student_id", user.id)
      .maybeSingle();
    classReminder = {
      studentId: user.id,
      initial: crPref as Record<string, unknown> | null,
      studentLabels: dict.dashboard.student,
    };
  }

  let tutorFinancialAccess: TutorFinancialAccessRow[] | null = null;
  if (profileSafe.role === "student" && !isMinor) {
    const tutors = await listStudentTutorsWithFinance(supabase, user.id);
    tutorFinancialAccess = tutors.map((row) => ({
      tutorId: row.tutorId,
      displayName: row.displayName,
      financialAccessActive: row.financialAccessActive,
    }));
  }

  return (
    <MyProfileSurfaceEntry
      backHref={backHref}
      localeSwitcher={dict.common.locale}
      locale={locale}
      email={user.email ?? ""}
      initial={{
        firstName: profileSafe.first_name ?? "",
        lastName: profileSafe.last_name ?? "",
        phone: profileSafe.phone?.trim() ?? "",
        dni: profileSafe.dni_or_passport ?? "",
        birthDate,
      }}
      minorPersonalLocked={minorPersonalLocked}
      avatarDisplayUrl={avatarDisplayUrl}
      displayName={displayName}
      labels={dict.dashboard.myProfile}
      classReminder={classReminder}
      tutorFinancialAccess={tutorFinancialAccess}
    />
  );
}
