import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{dict.admin.users.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
        {dict.admin.users.lead}
      </p>
      <div className="mt-6">
        <AdminCreateUserForm locale={locale} labels={dict.admin.users} />
      </div>
    </div>
  );
}
