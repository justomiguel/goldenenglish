import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { AdminCreateUserForm } from "@/components/dashboard/AdminCreateUserForm";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminUsersNewPage({ params }: PageProps) {
  const { locale } = await params;
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
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{dict.admin.users.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
        {dict.admin.users.lead}
      </p>
      <div className="mt-6">
        <AdminCreateUserForm
          locale={locale}
          legalAgeMajority={legalAgeMajority}
          labels={dict.admin.users}
          birthLabels={birthLabels}
          birthDateIncompleteMessage={dict.register.birthDateIncomplete}
        />
      </div>
    </div>
  );
}
