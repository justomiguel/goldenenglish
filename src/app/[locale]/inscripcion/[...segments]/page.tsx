import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  SectionEnrollmentLinkRoute,
  sectionEnrollmentLinkGenerateMetadata,
} from "@/app/[locale]/i/sectionEnrollmentLinkRoute";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; segments: string[] }>;
}

function resolveEnrollmentLinkParams(segments: string[]) {
  if (segments.length === 1 && segments[0]) {
    return { incomingSlug: null as string | null, token: segments[0] };
  }
  if (segments.length === 2 && segments[0] && segments[1]) {
    return { incomingSlug: segments[0], token: segments[1] };
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, segments } = await params;
  const resolved = resolveEnrollmentLinkParams(segments);
  if (!resolved) return {};
  return sectionEnrollmentLinkGenerateMetadata(locale, resolved.token);
}

export default async function SectionEnrollmentLinkPage({ params }: PageProps) {
  const { locale, segments } = await params;
  const resolved = resolveEnrollmentLinkParams(segments);
  if (!resolved) notFound();
  return (
    <SectionEnrollmentLinkRoute
      locale={locale}
      token={resolved.token}
      incomingSlug={resolved.incomingSlug}
    />
  );
}
