import { notFound, permanentRedirect, redirect } from "next/navigation";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { loadEventForPublicLanding } from "@/lib/dashboard/events/loadEventForPublicLanding";
import { buildEventPreviewPath } from "@/lib/site/publicSharePaths";

export const metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; eventId: string }>;
}

export default async function LegacyEventPreviewPage({ params }: PageProps) {
  const { locale, eventId } = await params;
  let supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"];
  try {
    ({ supabase } = await assertAdmin());
  } catch (err) {
    const message = (err as Error)?.message;
    if (message === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (message === ADMIN_SESSION_FORBIDDEN) notFound();
    throw err;
  }
  const event = await loadEventForPublicLanding(supabase, "", locale, {
    eventId,
    includeUnpublished: true,
  });
  if (!event) notFound();
  permanentRedirect(buildEventPreviewPath(locale, event.slug));
}
