import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminImportSurfaceGate } from "@/components/organisms/AdminImportSurfaceGate";
import { AdminImportScreenDesktop } from "@/components/desktop/organisms/AdminImportScreenDesktop";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminUsersImportPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.import.title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
        {dict.admin.home.cards.import}
      </p>
      <div className="mt-6">
        <AdminImportSurfaceGate
          dict={dict}
          embedded
          desktop={<AdminImportScreenDesktop dict={dict} embedded />}
        />
      </div>
    </div>
  );
}
