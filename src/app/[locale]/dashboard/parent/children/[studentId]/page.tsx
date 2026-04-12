import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createAdminClient } from "@/lib/supabase/admin";
import { ParentWardProfileSurfaceEntry } from "@/components/parent/ParentWardProfileSurfaceEntry";
import { ParentWardProfileForm } from "@/components/parent/ParentWardProfileForm";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; studentId: string }>;
}

export default async function ParentChildEditPage({ params }: PageProps) {
  const { locale, studentId } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard/parent/children/${studentId}`);
  }

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "parent") redirect(`/${locale}/dashboard`);

  const { data: link } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", user.id)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!link) redirect(`/${locale}/dashboard/parent`);

  const { data: ward } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, birth_date")
    .eq("id", studentId)
    .single();

  if (!ward) redirect(`/${locale}/dashboard/parent`);

  const admin = createAdminClient();
  const { data: authRow } = await admin.auth.admin.getUserById(studentId);
  const wardEmail = authRow?.user?.email?.trim() ?? "";

  const p = dict.dashboard.parent;

  return (
    <ParentWardProfileSurfaceEntry>
      <ParentWardProfileForm
        locale={locale}
        studentId={studentId}
        initial={{
          first_name: String(ward.first_name ?? ""),
          last_name: String(ward.last_name ?? ""),
          email: wardEmail,
          phone: ward.phone != null ? String(ward.phone) : null,
          birth_date: ward.birth_date != null ? String(ward.birth_date) : null,
        }}
        labels={p}
      />
    </ParentWardProfileSurfaceEntry>
  );
}
