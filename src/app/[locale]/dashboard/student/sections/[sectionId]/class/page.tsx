import type { Metadata } from "next";
import { DailyClassCallGate } from "@/components/daily/DailyClassCallGate";
import { DailyClassFailure } from "@/components/daily/DailyClassFailure";
import { dailyJoinErrorCopy } from "@/lib/academics/dailyJoinErrorCopy";
import { parseDailyClassQuery } from "@/lib/academics/parseDailyClassQuery";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { joinSectionDailyClassAction } from "@/app/[locale]/dashboard/student/sections/[sectionId]/class/actions";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
  searchParams: Promise<{ day?: string; start?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.dailyClass.join,
    robots: { index: false, follow: false },
  };
}

export default async function StudentDailyClassPage({ params, searchParams }: PageProps) {
  const { locale, sectionId } = await params;
  const query = await searchParams;
  const dict = await getDictionary(locale);
  const copy = dict.dashboard.dailyClass;
  const backHref = `/${locale}/dashboard/student`;
  const requested = parseDailyClassQuery(query);

  if (!requested) {
    return <DailyClassFailure message={copy.errors.window} backHref={backHref} backLabel={copy.back} />;
  }

  const result = await joinSectionDailyClassAction({ sectionId, requested });
  if (!result.ok) {
    return (
      <DailyClassFailure
        message={dailyJoinErrorCopy(result.code, copy.errors)}
        backHref={backHref}
        backLabel={copy.back}
      />
    );
  }

  return (
    <DailyClassCallGate
      url={result.url}
      token={result.token}
      leaveLabel={copy.leave}
      backHref={backHref}
    />
  );
}
