import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye } from "lucide-react";
import { PublicEventAdminEditLink } from "@/components/molecules/PublicEventAdminEditLink";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";

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
  const isEspacioZenit = surfaceVariant === "espaciozenit";

  return (
    <header className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={eventsHref}
          className={
            isEspacioZenit
              ? "inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--ez-cyan-soft)] underline decoration-[rgb(255_255_255_/25%)] underline-offset-[0.35em] transition hover:text-[var(--ez-cyan)] hover:decoration-[var(--ez-cyan)]"
              : "inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
          }
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
        <div
          className={
            isEspacioZenit
              ? "overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-black"
              : "overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40"
          }
        >
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
            : isEspacioZenit
              ? "overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] border-l-4 border-l-[var(--ez-cyan)] bg-black p-6 md:p-8"
              : "overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-secondary)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8"
        }
      >
        <p
          className={
            isEspacioZenit
              ? "text-xs font-bold uppercase tracking-[0.22em] text-[var(--ez-cyan)]"
              : "text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary)]"
          }
        >
          {labels.eventEyebrow}
        </p>
        {viewsLabel ? (
          <div
            className={
              isEspacioZenit
                ? "mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-400"
                : "mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-muted-foreground)]"
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4 shrink-0" aria-hidden />
              {viewsLabel}
            </span>
          </div>
        ) : null}
        <h1
          className={`max-w-3xl text-2xl font-bold leading-tight tracking-tight md:text-4xl ${viewsLabel ? "mt-3" : ""} ${
            isEspacioZenit
              ? "uppercase tracking-[0.06em] text-white"
              : "text-[var(--color-secondary)]"
          }`}
        >
          {title}
        </h1>
      </div>
    </header>
  );
}
