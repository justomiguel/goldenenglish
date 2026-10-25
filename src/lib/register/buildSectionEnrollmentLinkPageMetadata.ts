import type { Metadata } from "next";
import { buildSectionEnrollmentLinkShareMetadata } from "@/lib/register/buildSectionEnrollmentLinkShareMetadata";
import type { SectionEnrollmentLinkShareWeekdays } from "@/lib/register/buildSectionEnrollmentLinkShareMetadata";
import { sectionReferenceImagePublicUrl } from "@/lib/register/sectionReferenceImage";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import { buildPublicShareMetadata } from "@/lib/site/buildPublicShareMetadata";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";

const NOINDEX = { index: false, follow: false } as const;

export async function buildSectionEnrollmentLinkPageMetadata(input: {
  locale: string;
  brandName: string;
  weekdays: SectionEnrollmentLinkShareWeekdays;
  unavailableTitle: string;
  link: SectionEnrollmentLinkContext | null;
}): Promise<Metadata> {
  if (!input.link) {
    return { title: input.unavailableTitle, robots: NOINDEX };
  }
  const { url: supabaseUrl } = await readRequestSupabasePublicEnv();
  const share = buildSectionEnrollmentLinkShareMetadata({
    locale: input.locale,
    brandName: input.brandName,
    sectionName: input.link.sectionName,
    token: input.link.token,
    cohortName: input.link.cohortName,
    scheduleSlots: input.link.scheduleSlots,
    weekdays: input.weekdays,
    referenceImagePublicUrl: sectionReferenceImagePublicUrl(
      input.link.referenceImagePath,
      supabaseUrl,
    ),
  });
  return {
    title: share.title,
    description: share.description,
    robots: NOINDEX,
    ...(await buildPublicShareMetadata({
      title: share.title,
      description: share.description,
      path: share.path,
      coverImageUrl: share.coverImageUrl,
    })),
  };
}
