import type { SupabaseClient } from "@supabase/supabase-js";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog/domain";
import { formatBlogArticleListDate } from "@/lib/blog/formatBlogArticleListDate";
import { loadPublishedArticles } from "@/lib/blog/server/loadPublishedArticles";
import { formatEventDate } from "@/lib/events/formatEventDate";
import {
  loadPortalInstituteEventsForCalendar,
  type PortalInstituteEventCalendarRow,
} from "@/lib/calendar/loadPortalInstituteEventsForCalendar";

const NEWS_BLOG_LIMIT = 4;
const NEWS_EVENTS_LIMIT = 4;
const NEWS_MERGED_LIMIT = 8;

export type ParentHomeNewsItem =
  | {
      kind: "blog";
      id: string;
      title: string;
      href: string;
      sortAt: string;
      dateLabel: string;
    }
  | {
      kind: "institute_event";
      id: string;
      title: string;
      href: string;
      sortAt: string;
      dateLabel: string;
      location: string | null;
    };

function resolveBlogLocale(locale: string): BlogLocale {
  return (BLOG_LOCALES as readonly string[]).includes(locale) ? (locale as BlogLocale) : "es";
}

function upcomingEventsWindow(): { viewStartIso: string; viewEndIso: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 12);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { viewStartIso: iso(start), viewEndIso: iso(end) };
}

async function loadUpcomingInstituteEventsForParent(
  supabase: SupabaseClient,
  params: { locale: string; viewerSectionIds: string[] },
): Promise<PortalInstituteEventCalendarRow[]> {
  const { viewStartIso, viewEndIso } = upcomingEventsWindow();
  const rows = await loadPortalInstituteEventsForCalendar(supabase, {
    viewStartIso,
    viewEndIso,
    locale: params.locale,
    role: "parent",
    viewerSectionIds: params.viewerSectionIds,
  });
  const nowIso = new Date().toISOString();
  return rows
    .filter((row) => row.eventDateIso >= nowIso)
    .sort((a, b) => a.eventDateIso.localeCompare(b.eventDateIso))
    .slice(0, NEWS_EVENTS_LIMIT);
}

export async function loadParentHomeNewsFeed(
  supabase: SupabaseClient,
  params: {
    locale: string;
    viewerSectionIds: string[];
  },
): Promise<ParentHomeNewsItem[]> {
  const blogLocale = resolveBlogLocale(params.locale);
  const [blogPage, eventRows] = await Promise.all([
    loadPublishedArticles(supabase, {
      locale: blogLocale,
      page: 1,
      pageSize: NEWS_BLOG_LIMIT,
    }),
    loadUpcomingInstituteEventsForParent(supabase, {
      locale: params.locale,
      viewerSectionIds: params.viewerSectionIds,
    }),
  ]);

  const blogItems: ParentHomeNewsItem[] = blogPage.rows.flatMap((row) => {
    const translation = row.translation;
    if (!translation) return [];
    const sortAt = row.publishedAt ?? row.createdAt;
    return [
      {
        kind: "blog" as const,
        id: row.id,
        title: translation.title,
        href: `/${params.locale}/blog/${translation.slug}`,
        sortAt,
        dateLabel: formatBlogArticleListDate(row, params.locale),
      },
    ];
  });

  const eventItems: ParentHomeNewsItem[] = eventRows.map((row) => ({
    kind: "institute_event" as const,
    id: row.id,
    title: row.title,
    href: `/${params.locale}/events/${row.slug}`,
    sortAt: row.eventDateIso,
    dateLabel: formatEventDate(row.eventDateIso, params.locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    location: row.location,
  }));

  return [...blogItems, ...eventItems]
    .sort((a, b) => b.sortAt.localeCompare(a.sortAt))
    .slice(0, NEWS_MERGED_LIMIT);
}
