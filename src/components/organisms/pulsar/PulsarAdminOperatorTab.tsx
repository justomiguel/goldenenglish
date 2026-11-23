"use client";

import type { AiProviderListItem } from "@/lib/ai/aiProviderList";
import { PulsarAdminOpenAiKey } from "@/components/organisms/pulsar/PulsarAdminOpenAiKey";
import { PulsarAdminOperatorPassword } from "@/components/organisms/pulsar/PulsarAdminOperatorPassword";
import type { Dictionary } from "@/types/i18n";

export function PulsarAdminOperatorTab({
  locale,
  passwordSet,
  openAiKey,
  copy,
}: {
  locale: string;
  passwordSet: boolean;
  openAiKey: {
    saved: boolean;
    last4: string | null;
    providers?: readonly AiProviderListItem[];
    conversationProviderId?: string | null;
  };
  copy: Dictionary["pulsar"]["admin"];
}) {
  return (
    <div className="mt-6">
      <PulsarAdminOperatorPassword locale={locale} passwordSet={passwordSet} copy={copy.operator} />
      <PulsarAdminOpenAiKey
        locale={locale}
        saved={openAiKey.saved}
        last4={openAiKey.last4}
        providers={openAiKey.providers ?? []}
        conversationProviderId={openAiKey.conversationProviderId ?? null}
        copy={copy.openai}
      />
    </div>
  );
}
