import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { PublicEventAdminEditLink } from "@/components/molecules/PublicEventAdminEditLink";

interface PublicEventDetailHeroProps {
  locale: string;
  title: string;
  coverImageUrl: string | null;
  coverUnoptimized: boolean;
  adminEditHref?: string | null;
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
  labels,
}: PublicEventDetailHeroProps) {
  const eventsHref = `/${locale}/events`;

  return (
    <header className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={eventsHref}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
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
        <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40">
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

      <div
        className={
          coverImageUrl
            ? "space-y-1"
            : "overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-secondary)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8"
        }
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary)]">
          {labels.eventEyebrow}
        </p>
        <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-[var(--color-secondary)] md:text-4xl">
          {title}
        </h1>
      </div>
    </header>
  );
}
