import { getDictionary } from "@/lib/i18n/dictionaries";
import { PulsarAccountAuthForm } from "@/components/organisms/pulsar/PulsarAccountAuthForm";

function safeNext(locale: string, next: string | undefined): string {
  const fallback = `/${locale}/cuenta`;
  if (!next || !next.startsWith(`/${locale}/`)) return fallback;
  if (next.startsWith(`/${locale}/cuenta`) || next.startsWith(`/${locale}/admin/tenants/`)) return next;
  return fallback;
}

export default async function PulsarAccountLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const dict = await getDictionary(locale);
  return (
    <PulsarAccountAuthForm
      locale={locale}
      mode="login"
      copy={dict.pulsar.account}
      nextPath={safeNext(locale, query.next)}
    />
  );
}
