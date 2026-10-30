import { getDictionary } from "@/lib/i18n/dictionaries";
import { PulsarAccountAuthForm } from "@/components/organisms/pulsar/PulsarAccountAuthForm";

export default async function PulsarAccountRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return (
    <PulsarAccountAuthForm
      locale={locale}
      mode="register"
      copy={dict.pulsar.account}
      nextPath={`/${locale}/cuenta`}
    />
  );
}
