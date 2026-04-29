"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Award, Briefcase, Globe, MessageCircle, Share2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

type PublicLabels = Dictionary["publicStudentBadge"];
type AdminBadgesDict = Dictionary["admin"]["badges"];

export interface AdminBadgeSharePreviewProps {
  labels: AdminBadgesDict;
  /** publicStudentBadge slice for both locales so the preview can switch without round-trips. */
  publicLabels: { en: PublicLabels; es: PublicLabels };
  brand: { name: string; logoUrl: string };
  /** Public origin used to build the displayed share URL (e.g. https://yoursite.com). */
  siteOrigin: string;
  /** Sample token used only for the placeholder URL; nothing is fetched. */
  sampleToken: string;
  imageUrl: string | null;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
}

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

function safeHostname(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin;
  }
}

export function AdminBadgeSharePreview(props: AdminBadgeSharePreviewProps) {
  const {
    labels,
    publicLabels,
    brand,
    siteOrigin,
    sampleToken,
    imageUrl,
    titleEn,
    titleEs,
    descriptionEn,
    descriptionEs,
  } = props;
  const [previewLocale, setPreviewLocale] = useState<"en" | "es">("es");

  const title = (previewLocale === "en" ? titleEn : titleEs).trim() || labels.previewMissingTitle;
  const description =
    (previewLocale === "en" ? descriptionEn : descriptionEs).trim() ||
    labels.previewMissingDescription;
  const pubLabels = publicLabels[previewLocale];
  const dateLong = new Intl.DateTimeFormat(previewLocale, { dateStyle: "long" }).format(new Date());
  const shareUrl = `${siteOrigin}/${previewLocale}/b/${sampleToken}`;
  const hostname = safeHostname(siteOrigin);
  const heroImage = imageUrl ?? brand.logoUrl;

  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {labels.previewTitle}
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.previewLead}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {labels.previewLocaleLabel}
          </span>
          <div className="inline-flex overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
            {(["es", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setPreviewLocale(l)}
                className={
                  previewLocale === l
                    ? "bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-foreground)]"
                    : "bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-foreground)]"
                }
                aria-pressed={previewLocale === l}
              >
                {l === "en" ? labels.localeEn : labels.localeEs}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Frame title={labels.previewWhatsApp} icon={<MessageCircle className="h-4 w-4" aria-hidden />} shareUrl={shareUrl} shareUrlLabel={labels.previewShareUrl}>
          <div className="rounded-lg bg-[#dcf8c6] p-3 shadow-sm">
            <div className="overflow-hidden rounded-md border border-black/10 bg-white">
              <div className="aspect-[1.91/1] w-full bg-[var(--color-muted)]">
                {heroImage ? (
                  <Image src={heroImage} alt="" width={400} height={210} className="h-full w-full object-cover" unoptimized />
                ) : null}
              </div>
              <div className="p-3 text-xs">
                <p className="line-clamp-2 font-semibold text-black">{title}</p>
                <p className="mt-1 line-clamp-2 text-black/70">{clip(description, 140)}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-black/50">{hostname}</p>
              </div>
            </div>
          </div>
        </Frame>

        <Frame title={labels.previewLinkedIn} icon={<Briefcase className="h-4 w-4" aria-hidden />} shareUrl={shareUrl} shareUrlLabel={labels.previewShareUrl}>
          <div className="overflow-hidden rounded-md border border-[#0a66c2]/30 bg-white">
            <div className="aspect-[1.91/1] w-full bg-[var(--color-muted)]">
              {heroImage ? (
                <Image src={heroImage} alt="" width={400} height={210} className="h-full w-full object-cover" unoptimized />
              ) : null}
            </div>
            <div className="border-t border-[#0a66c2]/20 bg-[#f3f6f8] px-3 py-2 text-xs">
              <p className="line-clamp-2 font-semibold leading-snug text-black">{title}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-black/50">{hostname}</p>
            </div>
          </div>
        </Frame>

        <Frame title={labels.previewPublicPage} icon={<Globe className="h-4 w-4" aria-hidden />} shareUrl={shareUrl} shareUrlLabel={labels.previewShareUrl}>
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-center">
            {heroImage ? (
              <div className="mx-auto mb-2 h-14 w-14 overflow-hidden rounded-full bg-white ring-1 ring-[var(--color-border)]">
                <Image src={heroImage} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
              </div>
            ) : (
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white ring-1 ring-[var(--color-border)]">
                <Award className="h-5 w-5 text-[var(--color-foreground)]" aria-hidden />
              </div>
            )}
            <p className="text-sm font-semibold text-[var(--color-foreground)]">{title}</p>
            <p className="mt-1 line-clamp-3 text-xs text-[var(--color-muted-foreground)]">{description}</p>
            <p className="mt-2 text-[10px] text-[var(--color-muted-foreground)]">
              {pubLabels.earnedOn.replace("{date}", dateLong)}
            </p>
            <span className="mt-3 inline-flex items-center justify-center gap-1 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-[var(--color-primary-foreground)]">
              <Share2 className="h-3 w-3 shrink-0" aria-hidden />
              {pubLabels.openApp}
            </span>
          </div>
        </Frame>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        {labels.previewSampleHint.replace("{brand}", brand.name)}
      </p>
    </section>
  );
}

interface FrameProps {
  title: string;
  icon: ReactNode;
  shareUrl: string;
  shareUrlLabel: string;
  children: ReactNode;
}

function Frame({ title, icon, shareUrl, shareUrlLabel, children }: FrameProps) {
  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {icon}
        {title}
      </p>
      <div>{children}</div>
      <p className="break-all text-[10px] text-[var(--color-muted-foreground)]">
        <span className="font-medium">{shareUrlLabel}: </span>
        {shareUrl}
      </p>
    </div>
  );
}
