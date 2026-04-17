import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { loadOrProvisionDashboardProfileRow } from "@/lib/profile/loadOrProvisionDashboardProfileRow";

interface DashboardIndexProps {
  params: Promise<{ locale: string }>;
}

const SEGMENT: Record<string, string> = {
  admin: "admin",
  teacher: "teacher",
  student: "student",
  parent: "parent",
};

export default async function DashboardIndexPage({
  params,
}: DashboardIndexProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard`);
  }

  if (await resolveIsAdminSession(supabase, user.id)) {
    redirect(`/${locale}/dashboard/admin`);
  }

  const profile = await loadOrProvisionDashboardProfileRow(user);

  if (!profile?.role) {
    redirect(`/${locale}/dashboard/profile`);
  }

  const role = profile.role;
  const seg = SEGMENT[role] ?? "profile";
  redirect(`/${locale}/dashboard/${seg}`);
}
