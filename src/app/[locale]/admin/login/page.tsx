import { notFound, redirect } from "next/navigation";
import { getPulsarStaffSession, pulsarStaffHomePath } from "@/lib/pulsar/pulsarStaffAuth";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PulsarAdminLoginPage({ params }: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale } = await params;
  const session = await getPulsarStaffSession();
  if (session) {
    redirect(pulsarStaffHomePath(locale, session));
  }
  redirect(`/${locale}/cuenta/login?next=/${locale}/admin`);
}
