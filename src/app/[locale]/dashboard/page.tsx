import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "student";
  const seg = SEGMENT[role] ?? "student";
  redirect(`/${locale}/dashboard/${seg}`);
}
