import type { ReactNode } from "react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminSectionSubnav } from "@/components/dashboard/AdminSectionSubnav";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminStudentsLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const list = `/${locale}/dashboard/admin/students`;
  const users = `/${locale}/dashboard/admin/users`;

  return (
    <div className="space-y-6">
      <AdminSectionSubnav
        ariaLabel={dict.admin.usersNav.aria}
        items={[
          { href: list, label: dict.admin.usersNav.list, hint: dict.admin.usersNav.tipList, icon: "list" },
          {
            href: `${users}/new?role=student`,
            label: dict.admin.usersNav.add,
            hint: dict.admin.usersNav.tipAdd,
            icon: "userPlus",
            tourId: "admin-users-nav-add",
          },
          {
            href: `${users}/import`,
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
