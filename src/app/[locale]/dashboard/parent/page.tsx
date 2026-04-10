import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";

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
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">
        {dict.dashboard.parent.title}
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        {dict.dashboard.parent.lead}
      </p>
      <ul className="mt-8 space-y-3">
        {(kids ?? []).map((k) => (
          <li key={k.id}>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
              <span className="font-medium text-[var(--color-foreground)]">
                {k.first_name} {k.last_name}
              </span>
              <Link
                href={payHref}
                className="text-sm font-semibold text-[var(--color-primary)] underline"
              >
                {dict.dashboard.parent.navPay}
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {(!kids || kids.length === 0) && (
        <p className="mt-6 text-sm text-[var(--color-muted-foreground)]">
          {dict.dashboard.parent.lead}
        </p>
      )}
    </div>
  );
}
