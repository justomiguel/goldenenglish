import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadPublicQuestionnaire } from "@/lib/questionnaires/loadPublicQuestionnaire";
import { buildQuestionnaireSharePath } from "@/lib/site/publicSharePaths";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ done?: string }>;
}

export default async function LegacyQuestionnairePage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const { done } = await searchParams;
  const supabase = await createClient();
  const loaded = await loadPublicQuestionnaire(supabase, slug);
  if (!loaded) notFound();
  const path = buildQuestionnaireSharePath(locale, slug);
  permanentRedirect(done === "1" ? `${path}?done=1` : path);
}
