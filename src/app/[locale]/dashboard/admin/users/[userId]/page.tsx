import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadAdminUserDetail } from "@/lib/dashboard/loadAdminUserDetail";
import { loadAdminStudentBillingTabData } from "@/lib/dashboard/loadAdminStudentBillingTabData";
import { createClient } from "@/lib/supabase/server";
import { AdminUserDetailEntry } from "@/components/dashboard/AdminUserDetailEntry";
import type { Locale } from "@/types/i18n";

interface PageProps {
  params: Promise<{ locale: string; userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, userId } = await params;
  const dict = await getDictionary(locale);
  const empty = dict.common.emptyValue;
  const idOk = z.string().uuid().safeParse(userId).success;
  if (!idOk) {
    return { title: dict.admin.users.detailTitle, robots: { index: false, follow: false } };
  }
  const detail = await loadAdminUserDetail(userId, locale, empty, false, false);
  if (!detail) {
    return { title: dict.admin.users.detailTitle, robots: { index: false, follow: false } };
  }
  const name = `${detail.firstName} ${detail.lastName}`.trim();
  return {
    title: `${name} — ${dict.admin.users.detailTitle}`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { locale, userId } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();
  let viewerMayInlineEdit = false;
  if (sessionUser?.id) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sessionUser.id)
      .maybeSingle();
    viewerMayInlineEdit = viewerProfile?.role === "admin";
  }
  const detail = await loadAdminUserDetail(userId, locale, dict.common.emptyValue, viewerMayInlineEdit);
  if (!detail) notFound();

  const billing = detail.role === "student"
    ? await loadAdminStudentBillingTabData(supabase, userId)
    : null;

  return (
    <AdminUserDetailEntry
      locale={locale as Locale}
      labels={dict.admin.users}
      billingLabels={dict.admin.billing}
      detail={detail}
      billing={billing}
    />
  );
}
