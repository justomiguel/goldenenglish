import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ParentDashboardEntry } from "@/components/parent/ParentDashboardEntry";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ParentDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: links } = await supabase
    .from("parent_student")
    .select("student_id")
    .eq("parent_id", user.id);

  const ids = (links ?? []).map((l) => l.student_id as string);
  const { data: kids } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", ids)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };

  const payHref = `/${locale}/dashboard/parent/payments`;

  return (
    <ParentDashboardEntry
      title={dict.dashboard.parent.title}
      lead={dict.dashboard.parent.lead}
      navPay={dict.dashboard.parent.navPay}
      payHref={payHref}
      kids={kids ?? []}
    />
  );
}
