import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TeacherDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  void locale;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">
        {dict.dashboard.teacher.title}
      </h1>
      <p className="mt-4 text-[var(--color-muted-foreground)]">
        {dict.dashboard.teacher.lead}
      </p>
    </div>
  );
}
