import type { ReactNode } from "react";
import Image from "next/image";
import {
  adminSurfaceIcon,
  type AdminSurfaceIconId,
} from "@/lib/dashboard/adminSurfaceIcon";
import {
  adminPageHeaderArtSrc,
  type AdminPageHeaderArtFamily,
} from "@/lib/dashboard/adminPageHeaderArt";

function AdminPageHeaderArt({ src }: { src: string | null }) {
  return (
    <div
      aria-hidden
      data-testid="admin-page-header-art"
      className="pointer-events-none absolute inset-0 hidden sm:block"
    >
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 960 220"
          fill="none"
          preserveAspectRatio="xMaxYMid slice"
        >
          <path
            d="M548 220C590 148 668 104 758 118C820 128 868 98 960 72V220H548Z"
            fill="var(--color-primary)"
            opacity="0.1"
          />
          <path
            d="M640 220C686 168 748 132 830 146C888 156 928 128 960 108V220H640Z"
            fill="var(--color-primary)"
            opacity="0.08"
          />
          <circle cx="888" cy="118" r="46" fill="#F5C84C" />
          <path
            d="M796 36l3.4 8.6 9.1 3.4-9.1 3.4L796 60l-3.4-8.6-9.1-3.4 9.1-3.4L796 36z"
            fill="#7B61C6"
          />
          <path
            d="M918 52l2.4 6.1 6.5 2.4-6.5 2.4L918 69l-2.4-6.1-6.5-2.4 6.5-2.4L918 52z"
            fill="#7B61C6"
          />
          <path
            d="M704 54c6-2 10 4 7 8s-10 2-10-2 0-5 3-6z"
            fill="#7B61C6"
            opacity="0.85"
          />
        </svg>
      </div>
      {src ? (
        <Image
          src={src}
          alt=""
          width={360}
          height={528}
          unoptimized
          className="absolute top-[-1.35rem] right-3 h-[14.75rem] w-auto max-w-none object-contain object-bottom lg:right-8 lg:h-[16rem]"
        />
      ) : null}
    </div>
  );
}

export function AdminPageHeader({
  title,
  lead,
  iconId,
  artFamily,
  actions,
  tourAnchor,
}: {
  title: string;
  lead?: string;
  iconId?: AdminSurfaceIconId;
  artFamily?: AdminPageHeaderArtFamily;
  actions?: ReactNode;
  tourAnchor?: string;
}) {
  const icon = iconId ? adminSurfaceIcon(iconId, "h-8 w-8") : null;
  const artSrc = adminPageHeaderArtSrc(iconId, artFamily);

  return (
    <header
      {...(tourAnchor ? { "data-tour": tourAnchor } : {})}
      className="relative z-10 mt-5 overflow-visible rounded-3xl px-6 py-8 sm:px-8"
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-border))] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-primary)_8%,#eef3fb)_0%,color-mix(in_srgb,var(--color-primary)_12%,#e8eef8)_48%,color-mix(in_srgb,var(--color-primary)_6%,#f5f7fb)_100%)] shadow-[var(--shadow-soft)]"
      />
      <AdminPageHeaderArt src={artSrc} />
      <div className="relative z-[1] flex min-h-[8.75rem] max-w-xl flex-col justify-center gap-5 sm:max-w-[56%]">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          {icon ? (
            <span
              aria-hidden
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-primary)] shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
            >
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-primary)] md:text-[2.5rem]">
              {title}
            </h1>
            {lead ? (
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-muted-foreground))] sm:text-base">
                {lead}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
