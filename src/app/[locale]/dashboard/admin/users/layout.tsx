import type { ReactNode } from "react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminSectionSubnav } from "@/components/dashboard/AdminSectionSubnav";

interface UsersLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminUsersLayout({ children, params }: UsersLayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const base = `/${locale}/dashboard/admin/users`;

  return (
    <div className="space-y-6">
      <AdminSectionSubnav
        ariaLabel={dict.admin.usersNav.aria}
        items={[
          { href: base, label: dict.admin.usersNav.list },
          { href: `${base}/new`, label: dict.admin.usersNav.add },
          { href: `${base}/import`, label: dict.admin.usersNav.importCsv },
        ]}
      />
      {children}
    </div>
  );
}
