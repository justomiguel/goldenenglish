import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { AdminRegistrationsScreen } from "@/components/organisms/AdminRegistrationsScreen";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import {
  loadCurrentCohort,
  loadCurrentCohortSections,
} from "@/lib/academics/currentCohort";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminRegistrationsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const { data: rows } = await supabase.from("registrations").select("*");

  const list: AdminRegistrationRow[] = (rows ?? []).map((r) => ({
    id: String(r.id),
    first_name: String(r.first_name),
    last_name: String(r.last_name),
    dni: String(r.dni),
    email: String(r.email),
    phone: r.phone != null ? String(r.phone) : null,
    birth_date:
      r.birth_date != null && r.birth_date !== ""
        ? String(r.birth_date).slice(0, 10)
        : null,
    level_interest: r.level_interest != null ? String(r.level_interest) : null,
    status: String(r.status ?? ""),
    created_at: r.created_at != null ? String(r.created_at) : null,
    tutor_name: r.tutor_name != null ? String(r.tutor_name) : null,
    tutor_dni: r.tutor_dni != null ? String(r.tutor_dni) : null,
    tutor_email: r.tutor_email != null ? String(r.tutor_email) : null,
    tutor_phone: r.tutor_phone != null ? String(r.tutor_phone) : null,
    tutor_relationship:
      r.tutor_relationship != null ? String(r.tutor_relationship) : null,
  }));

  const legalAgeMajority = getLegalAgeMajorityFromSystem();

  const cohort = await loadCurrentCohort(supabase);
  const cohortSections = cohort
    ? await loadCurrentCohortSections(supabase)
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.registrations.title}
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        {dict.admin.registrations.lead}
      </p>
      {list.length === 0 ? (
        <p className="mt-8 text-[var(--color-muted-foreground)]">
          {dict.admin.registrations.none}
        </p>
      ) : (
        <AdminRegistrationsScreen
          locale={locale}
          rows={list}
          legalAgeMajority={legalAgeMajority}
          labels={dict.admin.registrations}
          tableLabels={dict.admin.table}
          userLabels={{
            password: dict.admin.users.password,
            passwordHint: dict.admin.users.passwordHint,
          }}
          currentCohortSections={cohortSections}
          currentCohortName={cohort?.name}
        />
      )}
    </div>
  );
}
