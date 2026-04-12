import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadAdminUserDetail } from "@/lib/dashboard/loadAdminUserDetail";
import { AdminUserDetailEntry } from "@/components/dashboard/AdminUserDetailEntry";

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
  const detail = await loadAdminUserDetail(userId, locale, empty);
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
  const detail = await loadAdminUserDetail(userId, locale, dict.common.emptyValue);
  if (!detail) notFound();

  const billingHref =
    detail.role === "student"
      ? `/${locale}/dashboard/admin/users/${userId}/billing`
      : undefined;

  return (
    <AdminUserDetailEntry
      locale={locale}
      labels={dict.admin.users}
      detail={detail}
      billingHref={billingHref}
    />
  );
}
