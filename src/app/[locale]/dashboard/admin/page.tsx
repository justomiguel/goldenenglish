import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminHubHome } from "@/components/dashboard/AdminHubHome";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface AdminHomeProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminHomePage({ params }: AdminHomeProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return <AdminHubHome locale={locale} dict={dict} />;
}
