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
          {
            href: base,
            label: dict.admin.usersNav.list,
            hint: dict.admin.usersNav.tipList,
            icon: "list",
          },
          {
            href: `${base}/new`,
            label: dict.admin.usersNav.add,
            hint: dict.admin.usersNav.tipAdd,
            icon: "userPlus",
          },
          {
            href: `${base}/import`,
            label: dict.admin.usersNav.importCsv,
            hint: dict.admin.usersNav.tipImport,
            icon: "upload",
          },
        ]}
      />
      {children}
    </div>
  );
}
