"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save } from "lucide-react";
import { savePlatformOperatorPasswordAction } from "@/app/[locale]/admin/operatorPasswordAction";
import { Button } from "@/components/atoms/Button";
import { operatorPasswordFormError } from "@/lib/pulsar/platformOperatorPasswordRules";
import type { Dictionary } from "@/types/i18n";

type OperatorCopy = Dictionary["pulsar"]["admin"]["operator"];

export function PulsarAdminOperatorPassword({
  locale,
  passwordSet,
  copy,
}: {
  locale: string;
  passwordSet: boolean;
  copy: OperatorCopy;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    setError(null);
    const data = new FormData(event.currentTarget);
    const result = await savePlatformOperatorPasswordAction({
      locale,
      password: String(data.get("password") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      setError(operatorPasswordFormError(result.errorCode, copy));
      return;
    }
    setNotice(copy.saved);
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3">
      <h2 className="inline-flex items-center gap-2 text-lg font-medium">
        <KeyRound className="h-4 w-4" aria-hidden />
        {copy.title}
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.ownDatabase}</p>
      <p className="text-sm">{passwordSet ? copy.statusSet : copy.statusMissing}</p>
      <label className="block text-sm font-semibold" htmlFor="centrolisto-operator-password">
        {copy.passwordLabel}
        <input
          id="centrolisto-operator-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={200}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </label>
      {notice ? <p className="text-sm">{notice}</p> : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button type="submit" isLoading={pending}>
        <Save className="h-4 w-4" aria-hidden />
        {copy.save}
      </Button>
    </form>
  );
}
