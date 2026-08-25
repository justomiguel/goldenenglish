import Link from "next/link";
import { Newspaper, Palette } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

export interface AdminCmsHubScreenProps {
  locale: string;
  dict: Dictionary["admin"]["cms"];
  blogEnabled: boolean;
}

export function AdminCmsHubScreen({ locale, dict, blogEnabled }: AdminCmsHubScreenProps) {
  const base = `/${locale}/dashboard/admin/cms`;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={dict.hubTitle}
        lead={dict.hubLead}
        iconId="cms"
        tourAnchor={ADMIN_TOUR_ANCHORS.cmsTitle}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <article
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]"
          data-tour={ADMIN_TOUR_ANCHORS.cmsTemplatesCard}
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Palette className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-2">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{dict.templatesNav}</h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">{dict.templatesHubDescription}</p>
              <Link
                href={`${base}/templates`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] transition hover:opacity-90"
              >
                <Palette className="h-4 w-4 shrink-0" aria-hidden />
                {dict.templatesHubCta}
              </Link>
            </div>
          </div>
        </article>

        {blogEnabled ? (
          <article
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]"
            data-tour={ADMIN_TOUR_ANCHORS.cmsBlogCard}
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <Newspaper className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 space-y-2">
                <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{dict.blogHubTitle}</h2>
                <p className="text-sm text-[var(--color-muted-foreground)]">{dict.blogHubDescription}</p>
                <Link
                  href={`${base}/blog`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] transition hover:opacity-90"
                >
                  <Newspaper className="h-4 w-4 shrink-0" aria-hidden />
                  {dict.blogHubCta}
                </Link>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
