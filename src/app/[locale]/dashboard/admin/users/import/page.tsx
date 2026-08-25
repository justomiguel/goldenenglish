import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminImportSurfaceGate } from "@/components/organisms/AdminImportSurfaceGate";
import { AdminImportScreenDesktop } from "@/components/desktop/organisms/AdminImportScreenDesktop";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminUsersImportPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const ss = dict.admin.users.spreadsheet;

  return (
    <div>
      <AdminPageHeader
        title={ss.importTitle}
        lead={ss.importLead}
        iconId="students"
        tourAnchor={ADMIN_TOUR_ANCHORS.usersImportTitle}
      />
      <div className="mt-6">
        <AdminImportSurfaceGate
          locale={locale}
          dict={dict}
          embedded
          desktop={<AdminImportScreenDesktop locale={locale} dict={dict} embedded />}
        />
      </div>
    </div>
  );
}
