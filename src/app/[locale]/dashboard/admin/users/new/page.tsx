import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { AdminCreateUserForm } from "@/components/dashboard/AdminCreateUserForm";
import { parseAdminCreateUserRoleQuery } from "@/lib/dashboard/parseAdminCreateUserRoleQuery";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
}

export default async function AdminUsersNewPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { role: roleQuery } = await searchParams;
  const dict = await getDictionary(locale);
  const legalAgeMajority = getLegalAgeMajorityFromSystem();
  const birthLabels = {
    birthDate: dict.register.birthDate,
    birthMonth: dict.register.birthMonth,
    birthYear: dict.register.birthYear,
    birthDay: dict.register.birthDay,
    birthDayPlaceholder: dict.register.birthDayPlaceholder,
    birthDateHint: dict.register.birthDateHint,
    birthDatePickPrompt: dict.register.birthDatePickPrompt,
    birthDatePickedAnnouncement: dict.register.birthDatePickedAnnouncement,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={dict.admin.users.title}
        lead={dict.admin.users.lead}
        iconId="students"
        tourAnchor={ADMIN_TOUR_ANCHORS.usersNewTitle}
      />
      <div>
        <AdminCreateUserForm
          locale={locale}
          legalAgeMajority={legalAgeMajority}
          labels={dict.admin.users}
          birthLabels={birthLabels}
          birthDateIncompleteMessage={dict.register.birthDateIncomplete}
          initialRole={parseAdminCreateUserRoleQuery(roleQuery)}
        />
      </div>
    </div>
  );
}
