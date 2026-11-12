import type { SupabaseClient } from "@supabase/supabase-js";
import { ThemeDocumentActiveNotice } from "@/components/dashboard/admin/cms/ThemeDocumentActiveNotice";
import { hasPublishedThemeDocument } from "@/lib/theme-document/hasPublishedThemeDocument";

export async function ThemeDocumentActiveNoticeGate({
  client,
  siteThemeId,
  href,
  body,
  linkLabel,
}: {
  client: SupabaseClient;
  siteThemeId: string;
  href: string;
  body: string;
  linkLabel: string;
}) {
  if (!(await hasPublishedThemeDocument(client, siteThemeId))) return null;
  return <ThemeDocumentActiveNotice href={href} body={body} linkLabel={linkLabel} />;
}
