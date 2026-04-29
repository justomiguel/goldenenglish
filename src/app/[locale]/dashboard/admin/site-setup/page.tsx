import { redirect } from "next/navigation";

interface AdminSiteSetupRedirectProps {
  params: Promise<{ locale: string }>;
}

/** Legacy URL — canonical wizard lives under `/setup/first-run`. */
export default async function AdminSiteSetupRedirect({
  params,
}: AdminSiteSetupRedirectProps) {
  const { locale } = await params;
  redirect(`/${locale}/setup/first-run`);
}
