import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { loadEventForPublicLanding } from "@/lib/dashboard/events/loadEventForPublicLanding";
import { resolveSessionEventAdminEditHref } from "@/lib/dashboard/events/resolveSessionEventAdminEditHref";
import { incrementEventViewCount } from "@/lib/events/server/incrementEventViewCount";
import {
  buildContentViewSessionKey,
  getContentViewViewerSessionId,
} from "@/lib/analytics/server/contentViewSession";
import { htmlToPlain } from "@/lib/blog/htmlToPlain";
import { getBrandForRequest } from "@/lib/brand/server";
import { EventDescriptionHtml } from "@/components/organisms/EventDescriptionHtml";
import { PublicEventDetailHero } from "@/components/molecules/PublicEventDetailHero";
import { PublicEventDetailPanel } from "@/components/molecules/PublicEventDetailPanel";
import { resolveEventCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";
import { stripFirstImageFromHtml } from "@/lib/rich-content/stripFirstImageFromHtml";
import { buildPublicShareMetadata } from "@/lib/site/buildPublicShareMetadata";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const event = await loadEventForPublicLanding(supabase, slug, locale);
  if (!event) {
    return { title: dict.events.public.metaTitle };
  }
  const description = htmlToPlain(event.description) || dict.events.public.metaDescription;
  const brand = await getBrandForRequest();
  const coverImageUrl = resolveEventCoverImageUrl(event.description);
  const share = buildPublicShareMetadata({
    title: event.title,
    description,
    path: `/${locale}/events/${slug}`,
    coverImageUrl,
    fallbackImageUrl: brand.logoPath,
    ogType: "website",
  });
  return {
    title: `${event.title} · ${dict.events.public.metaTitle}`,
    description,
    alternates: { canonical: `/${locale}/events/${slug}` },
    ...share,
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const event = await loadEventForPublicLanding(supabase, slug, locale);
  if (!event) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerSessionId = await getContentViewViewerSessionId();
  await incrementEventViewCount(supabase, {
    eventId: event.id,
    entity: AnalyticsEntity.events,
    userId: user?.id ?? null,
    sessionKey: buildContentViewSessionKey(locale, event.slug, viewerSessionId),
  });

  const adminEditHref = await resolveSessionEventAdminEditHref(supabase, locale, event.id);

  const coverImageUrl = resolveEventCoverImageUrl(event.description);
  const coverUnoptimized =
    coverImageUrl?.startsWith("/images/") || coverImageUrl?.startsWith("data:");
  const descriptionHtml = coverImageUrl
    ? stripFirstImageFromHtml(event.description)
    : event.description;
  const publicLabels = dict.events.public;
  const panelLabels = {
    registrationCardTitle: publicLabels.registrationCardTitle,
    dateLabel: publicLabels.dateLabel,
    locationLabel: publicLabels.locationLabel,
    priceLabel: publicLabels.priceLabel,
    free: publicLabels.free,
    priceLocal: publicLabels.priceLocal,
    priceNonLocal: publicLabels.priceNonLocal,
    registerCta: publicLabels.registerCta,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: htmlToPlain(event.description),
    startDate: event.eventDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    ...(coverImageUrl ? { image: coverImageUrl } : {}),
  };

  return (
    <main className="space-y-6">
      <PublicEventDetailHero
        locale={locale}
        title={event.title}
        coverImageUrl={coverImageUrl}
        coverUnoptimized={Boolean(coverUnoptimized)}
        adminEditHref={adminEditHref}
        labels={{
          backToEvents: publicLabels.backToEvents,
          eventEyebrow: publicLabels.eventEyebrow,
          adminEdit: publicLabels.adminEdit,
          adminEditAriaLabel: publicLabels.adminEditAriaLabel,
        }}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">
          <EventDescriptionHtml
            html={descriptionHtml}
            labels={{
              downloadFile: publicLabels.downloadFile,
              audioLabel: publicLabels.audioLabel,
              videoLabel: publicLabels.videoLabel,
              attachmentTypes: publicLabels.attachmentTypes,
              pdfViewer: publicLabels.pdfViewer,
            }}
          />
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-6">
          <PublicEventDetailPanel
            locale={locale}
            eventDate={event.eventDate}
            location={event.location}
            priceSource={{
              price: event.price,
              priceLocal: event.priceLocal,
              priceNonLocal: event.priceNonLocal,
            }}
            currency={event.currency}
            registerHref={`/${locale}/events/${event.slug}/register`}
            labels={panelLabels}
          />
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
