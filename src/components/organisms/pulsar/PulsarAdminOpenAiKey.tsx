"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, List, Save, Trash2 } from "lucide-react";
import {
  clearPlatformOpenAiKeyAction,
  savePlatformOpenAiKeyAction,
  testPlatformOpenAiModelsAction,
} from "@/app/[locale]/admin/openAiKeyAction";
import { Button } from "@/components/atoms/Button";
import type { AiProviderListItem } from "@/lib/ai/aiProviderList";
import { openAiKeyFormError } from "@/lib/ai/providers/openai/openAiKeyFormError";
import type { Dictionary } from "@/types/i18n";

type OpenAiCopy = Dictionary["pulsar"]["admin"]["openai"];

export function PulsarAdminOpenAiKey({
  locale,
  saved,
  last4,
  providers = [],
  conversationProviderId = null,
  copy,
}: {
  locale: string;
  saved: boolean;
  last4: string | null;
  providers?: readonly AiProviderListItem[];
  conversationProviderId?: string | null;
  copy: OpenAiCopy;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"save" | "clear" | "test" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelIds, setModelIds] = useState<string[] | null>(null);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("save");
    setNotice(null);
    setError(null);
    const data = new FormData(event.currentTarget);
    const result = await savePlatformOpenAiKeyAction({
      locale,
      apiKey: String(data.get("apiKey") ?? ""),
    });
    setPending(null);
    if (!result.ok) {
      setError(openAiKeyFormError(result.errorCode, copy.errors));
      return;
    }
    setNotice(copy.saved);
    event.currentTarget.reset();
    router.refresh();
  }

  async function onClear() {
    setPending("clear");
    setNotice(null);
    setError(null);
    const result = await clearPlatformOpenAiKeyAction({ locale });
    setPending(null);
    if (!result.ok) {
      setError(openAiKeyFormError(result.errorCode, copy.errors));
      return;
    }
    setModelIds(null);
    setNotice(copy.cleared);
    router.refresh();
  }

  async function onTest() {
    setPending("test");
    setNotice(null);
    setError(null);
    const result = await testPlatformOpenAiModelsAction();
    setPending(null);
    if (!result.ok) {
      setModelIds(null);
      setError(openAiKeyFormError(result.errorCode, copy.errors));
      return;
    }
    setModelIds(result.modelIds);
  }

  return (
    <form onSubmit={onSave} className="mt-8 max-w-xl space-y-3">
      <h2 className="inline-flex items-center gap-2 text-lg font-medium">
        <KeyRound className="h-4 w-4" aria-hidden />
        {copy.title}
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>
      <p className="text-sm">{copy.serviceBinding}</p>
      <ul aria-label={copy.providersTitle} className="space-y-1 text-sm">
        {providers.map((provider) => (
          <li key={provider.id}>
            {provider.label}
            {provider.enabled ? ` · ${copy.providerOn}` : ` · ${copy.providerOff}`}
            {provider.id === conversationProviderId ? ` · ${copy.providerBound}` : ""}
          </li>
        ))}
      </ul>
      {providers.length === 0 ? <p className="text-sm">{copy.providersEmpty}</p> : null}
      <p className="text-sm">{saved ? copy.statusSet.replace("{last4}", last4 ?? "") : copy.statusMissing}</p>
      <label className="block text-sm font-semibold" htmlFor="centrolisto-openai-key">
        {copy.keyLabel}
        <input
          id="centrolisto-openai-key"
          name="apiKey"
          type="password"
          autoComplete="new-password"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </label>
      {notice ? <p className="text-sm">{notice}</p> : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      {modelIds ? (
        <div>
          <p className="text-sm font-semibold">{copy.modelsTitle}</p>
          {modelIds.length === 0 ? <p className="text-sm">{copy.modelsEmpty}</p> : null}
          <ul className="mt-1 list-disc pl-5 text-sm">
            {modelIds.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" isLoading={pending === "save"}>
          <Save className="h-4 w-4" aria-hidden />
          {copy.save}
        </Button>
        <Button type="button" variant="ghost" isLoading={pending === "clear"} onClick={onClear}>
          <Trash2 className="h-4 w-4" aria-hidden />
          {copy.clear}
        </Button>
        <Button type="button" variant="ghost" isLoading={pending === "test"} onClick={onTest}>
          <List className="h-4 w-4" aria-hidden />
          {copy.test}
        </Button>
      </div>
    </form>
  );
}
