import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminImportSurfaceGate } from "@/components/organisms/AdminImportSurfaceGate";
import { AdminImportScreenDesktop } from "@/components/desktop/organisms/AdminImportScreenDesktop";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

interface AdminImportPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminImportPage({ params }: AdminImportPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <AdminImportSurfaceGate
      dict={dict}
      locale={locale}
      desktop={<AdminImportScreenDesktop dict={dict} locale={locale} />}
    />
  );
}
