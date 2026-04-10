import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminCreateUserForm } from "@/components/dashboard/AdminCreateUserForm";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminUsersPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  void locale;

  return (
    <div>
      <AdminCreateUserForm labels={dict.admin.users} />
    </div>
  );
}
