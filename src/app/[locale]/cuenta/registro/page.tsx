import { PulsarAccountAuthForm } from "@/components/organisms/pulsar/PulsarAccountAuthForm";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";

export default async function PulsarAccountRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pais?: string | string[] }>;
}) {
  const { locale } = await params;
  const { dict } = await loadCentrolistoDictionary(locale, await searchParams);
  return (
    <PulsarAccountAuthForm
      locale={locale}
      mode="register"
      copy={dict.pulsar.account}
      nextPath={`/${locale}/cuenta`}
    />
  );
}
