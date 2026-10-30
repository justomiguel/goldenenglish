import { redirect } from "next/navigation";
import { resolvePulsarPostLoginPath } from "@/app/[locale]/admin/sessionActions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PulsarAccountAuthForm } from "@/components/organisms/pulsar/PulsarAccountAuthForm";
import { safePulsarNext } from "@/lib/pulsar/safePulsarNext";

export default async function PulsarAccountLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const nextPath = safePulsarNext(locale, query.next) ?? `/${locale}/cuenta`;
  const destination = await resolvePulsarPostLoginPath(locale, query.next ?? null);
  if (!destination.endsWith("/cuenta/login")) redirect(destination);
  const dict = await getDictionary(locale);
  return (
    <PulsarAccountAuthForm
      locale={locale}
      mode="login"
      copy={dict.pulsar.account}
      nextPath={nextPath}
    />
  );
}
