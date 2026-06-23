import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadPublicEventsList } from "@/lib/dashboard/events/loadPublicEventsList";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { PublicEventListCard } from "@/components/molecules/PublicEventListCard";
import { loadPublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventListPageHeaderClasses } from "@/lib/events/publicEventSurfaceClasses";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.events.public.metaTitle,
    description: dict.events.public.metaDescription,
  };
}

export default async function PublicEventsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(String(sp.page ?? "1"), 10) || 1);
  const supabase = await createClient();
  const [result, surfaceVariant] = await Promise.all([
    loadPublicEventsList(supabase, locale, page, 12),
    loadPublicEventSurfaceVariant(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const showAdminEdit =
    user != null ? await resolveIsAdminSession(supabase, user.id) : false;
  const publicLabels = dict.events.public;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: result.rows.map((row, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `/${locale}/events/${row.slug}`,
      name: row.title,
    })),
  };

  const cardLabels = {
    dateLabel: publicLabels.dateLabel,
    priceLabel: publicLabels.priceLabel,
    free: publicLabels.free,
    priceLocal: publicLabels.priceLocal,
    priceNonLocal: publicLabels.priceNonLocal,
    viewDetail: publicLabels.viewDetail,
    adminEdit: publicLabels.adminEdit,
    adminEditAriaLabel: publicLabels.adminEditAriaLabel,
  };

  const headerClasses = publicEventListPageHeaderClasses(surfaceVariant);

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className={headerClasses.title}>{publicLabels.title}</h1>
        <p className={headerClasses.lead}>{publicLabels.lead}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {result.rows.map((row) => (
          <PublicEventListCard
            key={row.id}
            locale={locale}
            row={row}
            showAdminEdit={showAdminEdit}
            surfaceVariant={surfaceVariant}
            labels={cardLabels}
          />
        ))}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </main>
  );
}
