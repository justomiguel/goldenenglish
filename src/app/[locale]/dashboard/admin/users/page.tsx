import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUsersScreen } from "@/components/organisms/AdminUsersScreen";
import type { AdminUserRow } from "@/lib/dashboard/adminUsersTableHelpers";
import { listAllAuthUsers } from "@/lib/supabase/listAllAuthUsers";
import { resolveAvatarUrlForAdmin } from "@/lib/dashboard/resolveAvatarUrl";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminUsersListPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? "";

  const admin = createAdminClient();
  const { users, error: listError } = await listAllAuthUsers(admin);
  if (listError) {
    console.error("[admin/users] listAllAuthUsers:", listError);
    throw new Error("Failed to load users");
  }
  const ids = users.map((u) => u.id);

  const { data: profiles } =
    ids.length > 0
      ? await admin
          .from("profiles")
          .select("id, role, first_name, last_name, phone, avatar_url")
          .in("id", ids)
      : { data: [] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rowsUnsorted = await Promise.all(
    users.map(async (u) => {
      const p = profileById.get(u.id);
      const avatarDisplayUrl = await resolveAvatarUrlForAdmin(admin, p?.avatar_url);
      return {
        id: u.id,
        email: u.email ?? "—",
        firstName: p?.first_name ?? "—",
        lastName: p?.last_name ?? "—",
        role: p?.role ?? "—",
        phone: p?.phone?.trim() ? p.phone : "—",
        avatarDisplayUrl,
      };
    }),
  );

  const rows: AdminUserRow[] = rowsUnsorted.sort((a, b) =>
    a.email.localeCompare(b.email, locale, { sensitivity: "base" }),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.users.listTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
        {dict.admin.users.listLead}
      </p>
      <div className="mt-6">
        <AdminUsersScreen
          rows={rows}
          locale={locale}
          currentUserId={currentUserId}
          labels={dict.admin.users}
          tableLabels={dict.admin.table}
        />
      </div>
    </div>
  );
}
