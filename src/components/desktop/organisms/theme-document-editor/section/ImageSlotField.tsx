"use client";

import { useState } from "react";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { readFileAsDataUrlBase64 } from "@/lib/client/readFileAsDataUrlBase64";

export function ImageSlotField({
  label,
  readingLabel,
  sendingLabel,
  failedLabel,
  onChange,
}: {
  label: string;
  readingLabel: string;
  sendingLabel: string;
  failedLabel: string;
  onChange: (base64: string) => void;
}) {
  const [phase, setPhase] = useState<null | { kind: "read"; value: number } | { kind: "send" }>(null);
  const [failed, setFailed] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFailed(false);
    setPhase({ kind: "read", value: 0 });
    try {
      const result = await readFileAsDataUrlBase64(file, {
        onProgress: (ratio) => setPhase({ kind: "read", value: Math.round(ratio * 100) }),
      });
      setPhase({ kind: "send" });
      onChange(result.base64);
    } catch {
      setFailed(true);
    } finally {
      setPhase(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm text-[var(--color-foreground)]">
        <span>{label}</span>
        <input
          type="file"
          accept="image/*"
          aria-label={label}
          className="min-h-[44px] text-sm"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </label>
      {phase ? (
        <InlineUploadProgressBar
          label={phase.kind === "read" ? readingLabel : sendingLabel}
          value={phase.kind === "read" ? phase.value : undefined}
          indeterminate={phase.kind === "send"}
        />
      ) : null}
      {failed ? (
        <p role="alert" className="text-sm text-[var(--color-foreground)]">
          {failedLabel}
        </p>
      ) : null}
    </div>
  );
}
