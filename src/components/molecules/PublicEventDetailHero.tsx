import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye } from "lucide-react";
import { PublicEventAdminEditLink } from "@/components/molecules/PublicEventAdminEditLink";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventDetailHeroChrome } from "@/lib/events/publicEventSurfaceClasses";

interface PublicEventDetailHeroProps {
  locale: string;
  title: string;
  coverImageUrl: string | null;
  coverUnoptimized: boolean;
  adminEditHref?: string | null;
  viewsLabel?: string;
  surfaceVariant?: PublicEventSurfaceVariant;
  labels: {
    backToEvents: string;
    eventEyebrow: string;
    adminEdit: string;
    adminEditAriaLabel: string;
  };
}

export function PublicEventDetailHero({
  locale,
  title,
  coverImageUrl,
  coverUnoptimized,
  adminEditHref,
  viewsLabel,
  surfaceVariant = "default",
  labels,
}: PublicEventDetailHeroProps) {
  const eventsHref = `/${locale}/events`;
  const chrome = publicEventDetailHeroChrome(surfaceVariant);

  return (
    <header className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={eventsHref} className={chrome.backLink}>
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {labels.backToEvents}
        </Link>
        {adminEditHref ? (
          <PublicEventAdminEditLink
            href={adminEditHref}
            label={labels.adminEdit}
            ariaLabel={labels.adminEditAriaLabel}
          />
        ) : null}
      </div>

      {coverImageUrl ? (
        <div className={chrome.cover}>
          <Image
            src={coverImageUrl}
            alt=""
            width={1600}
            height={900}
            className="mx-auto h-auto max-h-[min(70dvh,640px)] w-full object-contain object-center"
            sizes="(max-width: 1024px) 100vw, 1152px"
            priority
            unoptimized={coverUnoptimized}
          />
        </div>
      ) : null}

      <div className={coverImageUrl ? "space-y-1" : chrome.untitled}>
        <p className={chrome.eyebrow}>{labels.eventEyebrow}</p>
        {viewsLabel ? (
          <div className={chrome.views}>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4 shrink-0" aria-hidden />
              {viewsLabel}
            </span>
          </div>
        ) : null}
        <h1
          className={`max-w-3xl text-2xl font-bold leading-tight tracking-tight md:text-4xl ${viewsLabel ? "mt-3" : ""} ${chrome.title}`}
        >
          {title}
        </h1>
      </div>
    </header>
  );
}
