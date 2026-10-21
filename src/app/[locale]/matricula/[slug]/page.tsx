import { notFound, permanentRedirect } from "next/navigation";
import { loadRegistrationMatriculaPayPage } from "@/lib/register/loadRegistrationMatriculaPayPage";
import { buildMatriculaPayPath } from "@/lib/site/publicSharePaths";

export const dynamic = "force-dynamic";

/** One segment is the old pay token. The slot name stays `slug` for the two-segment route. */
export default async function LegacyMatriculaPayPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: token } = await params;
  const page = await loadRegistrationMatriculaPayPage(token);
  if (!page) notFound();
  permanentRedirect(buildMatriculaPayPath(locale, page.sectionLabel, token));
}
