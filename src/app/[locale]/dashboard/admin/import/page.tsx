import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { AdminImportSurfaceGate } from "@/components/organisms/AdminImportSurfaceGate";
import { AdminImportScreenDesktop } from "@/components/desktop/organisms/AdminImportScreenDesktop";

interface AdminImportPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminImportPage({ params }: AdminImportPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard/admin/import`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect(`/${locale}`);
  }

  return (
    <AdminImportSurfaceGate
      dict={dict}
      locale={locale}
      desktop={<AdminImportScreenDesktop dict={dict} locale={locale} />}
    />
  );
}
