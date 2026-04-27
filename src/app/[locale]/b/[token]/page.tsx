import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { getPublicSiteUrl, absoluteUrl } from "@/lib/site/publicUrl";
import { loadPublicStudentBadgeShareByToken } from "@/lib/badges/loadPublicStudentBadgeShare";
import { isStudentBadgeCode } from "@/lib/badges/badgeCodes";
import { School } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, token } = await params;
  const dict = await getDictionary(locale);
  const data = await loadPublicStudentBadgeShareByToken(token);
  const site = getPublicSiteUrl();
  if (!data || !isStudentBadgeCode(data.badgeCode)) {
    return {
      title: dict.publicStudentBadge.notFound,
      description: dict.publicStudentBadge.notFound,
      robots: { index: false, follow: false },
    };
  }
  const def = dict.dashboard.student.badges.definitions[data.badgeCode as keyof typeof dict.dashboard.student.badges.definitions];
  const title = def && typeof def === "object" && "title" in def ? String(def.title) : dict.publicStudentBadge.title;
  const d = new Date(data.earnedAt);
  const when = Number.isNaN(d.getTime())
    ? data.earnedAt
    : new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
  const description = dict.publicStudentBadge.earnedOn.replace("{date}", when);
  const path = `/${locale}/b/${token}`;
  const abs = absoluteUrl(path);
  return {
    title: `${title} — ${getBrandPublic().name}`,
    description: `${description} — ${dict.publicStudentBadge.headline}`,
    alternates: abs
      ? {
          canonical: abs.toString(),
        }
      : undefined,
    metadataBase: site ?? undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url: abs ? abs.toString() : path,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: false, follow: false },
  };
}

export default async function PublicStudentBadgePage({ params }: PageProps) {
  const { locale, token } = await params;
  const dict = await getDictionary(locale);
  const data = await loadPublicStudentBadgeShareByToken(token);
  if (!data || !isStudentBadgeCode(data.badgeCode)) notFound();

  const def = dict.dashboard.student.badges.definitions[data.badgeCode as keyof typeof dict.dashboard.student.badges.definitions];
  const title =
    def && typeof def === "object" && "title" in def
      ? String((def as { title: string }).title)
      : data.badgeCode;
  const sub =
    def && typeof def === "object" && "description" in def
      ? String((def as { description: string }).description)
      : null;
  const d = new Date(data.earnedAt);
  const when = Number.isNaN(d.getTime())
    ? data.earnedAt
    : new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(d);
  return (
    <div className="min-h-svh bg-[var(--color-muted)] px-4 py-10">
      <article
        className="mx-auto max-w-lg rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm"
        data-testid="public-student-badge-card"
      >
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{title}</h1>
        {sub ? <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{sub}</p> : null}
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
          {dict.publicStudentBadge.earnedOn.replace("{date}", when)}
        </p>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dict.publicStudentBadge.headline}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-6 py-2 text-base font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <School className="h-4 w-4 shrink-0" aria-hidden />
            {dict.publicStudentBadge.openApp}
          </Link>
        </div>
      </article>
    </div>
  );
}
