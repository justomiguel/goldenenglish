"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks } from "lucide-react";
import { setRegisterExtrasPack } from "@/app/[locale]/dashboard/admin/settings/setRegisterExtrasPack";
import { Label } from "@/components/atoms/Label";
import {
  REGISTER_EXTRAS_PACKS,
  type RegisterExtrasPack,
} from "@/lib/register/packs/registerExtrasPack";
import type { Dictionary } from "@/types/i18n";

interface RegisterExtrasPackSettingsFormProps {
  locale: string;
  initialPack: RegisterExtrasPack | null;
  labels: Dictionary["admin"]["settings"];
}

export function RegisterExtrasPackSettingsForm({
  locale,
  initialPack,
  labels,
}: RegisterExtrasPackSettingsFormProps) {
  const [pack, setPack] = useState<RegisterExtrasPack | "">(initialPack ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const optionLabel: Record<RegisterExtrasPack, string> = {
    martial_arts_uniform: labels.registerExtrasPackUniform,
    family_guide: labels.registerExtrasPackFamily,
  };

  async function onPick(next: string) {
    const parsed = next === "" ? null : REGISTER_EXTRAS_PACKS.find((id) => id === next) ?? null;
    if (next !== "" && parsed == null) {
      setMsg(labels.registerExtrasPackInvalid);
      return;
    }
    setMsg(null);
    const res = await setRegisterExtrasPack(locale, parsed);
    if (res.ok) {
      setPack(parsed ?? "");
      setMsg(labels.saved);
      router.refresh();
      return;
    }
    setMsg(
      res.code === "invalid_input"
        ? labels.registerExtrasPackInvalid
        : res.code === "forbidden"
          ? labels.registerExtrasPackForbidden
          : labels.registerExtrasPackSaveFailed,
    );
  }

  return (
    <div className="mt-6 space-y-2 border-t border-[var(--color-border)] pt-4">
      <Label htmlFor="settings-register-extras-pack">
        <span className="inline-flex items-center gap-2">
          <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
          {labels.registerExtrasPackLabel}
        </span>
      </Label>
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.registerExtrasPackHint}</p>
      <select
        id="settings-register-extras-pack"
        value={pack}
        onChange={(event) => void onPick(event.target.value)}
        className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]"
      >
        <option value="">{labels.registerExtrasPackNone}</option>
        {REGISTER_EXTRAS_PACKS.map((id) => (
          <option key={id} value={id}>
            {optionLabel[id]}
          </option>
        ))}
      </select>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </div>
  );
}
