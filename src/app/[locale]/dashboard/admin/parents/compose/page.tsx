import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { AdminParentsCompose } from "@/components/dashboard/AdminParentsCompose";
import { parseParentRecipientScope } from "@/lib/parents/parseParentRecipientScope";
import { parentFilterScopeQuery } from "@/lib/parents/parentFilterScopeQuery";
import { resolveParentRecipients } from "@/lib/dashboard/resolveParentRecipients";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminParentsComposePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const raw = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const admin = createAdminClient();
  const scope = parseParentRecipientScope(raw);
  const parents = await resolveParentRecipients(admin, scope);
  const listHref = `/${locale}/dashboard/admin/parents`;
  const scopeParams: Record<string, string> =
    scope.kind === "ids" ? { ids: scope.ids.join(",") } : parentFilterScopeQuery(scope);

  return (
    <div>
      <Link
        href={listHref}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {dict.admin.parents.composeBack}
      </Link>
      <div className="mt-4">
        <AdminPageHeader
          title={dict.admin.parents.composeTitle}
          lead={dict.admin.parents.composeLead}
          iconId="parents"
        />
      </div>
      <div className="mt-6 max-w-3xl">
        <AdminParentsCompose
          locale={locale}
          labels={dict.admin.parents}
          parents={parents}
          scopeParams={scopeParams}
          listHref={listHref}
        />
      </div>
    </div>
  );
}
