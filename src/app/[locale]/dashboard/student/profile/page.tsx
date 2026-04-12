import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveAvatarDisplayUrl } from "@/lib/dashboard/resolveAvatarUrl";
import { PortalProfileSurfaceEntry } from "@/components/molecules/PortalProfileSurfaceEntry";
import type { ProfileAvatarFormLabels } from "@/components/molecules/ProfileAvatarPanel";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard/student/profile`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") redirect(`/${locale}/dashboard`);

  const avatarDisplayUrl = await resolveAvatarDisplayUrl(supabase, profile?.avatar_url);
  const displayName =
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
    user.email?.split("@")[0] ||
    "?";

  const s = dict.dashboard.student;
  const labels: ProfileAvatarFormLabels = {
    avatarHint: s.avatarHint,
    avatarChoose: s.avatarChoose,
    avatarUpload: s.avatarUpload,
    avatarSuccess: s.avatarSuccess,
    avatarError: s.avatarError,
    avatarTooBig: s.avatarTooBig,
    avatarInvalidType: s.avatarInvalidType,
    avatarForbidden: s.avatarForbidden,
    avatarNoFile: s.avatarNoFile,
  };

  return (
    <PortalProfileSurfaceEntry
      title={s.profileTitle}
      lead={s.profileLead}
      locale={locale}
      avatarDisplayUrl={avatarDisplayUrl}
      displayName={displayName}
      labels={labels}
    />
  );
}
