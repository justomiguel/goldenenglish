"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { SectionReferenceImageField } from "@/components/molecules/SectionReferenceImageField";
import { SectionReferenceThumb } from "@/components/molecules/SectionReferenceThumb";
import { readImageFileAsBase64 } from "@/components/dashboard/admin/site-setup/readImageFileAsBase64";
import {
  removeSectionReferenceImageAction,
  uploadSectionReferenceImageAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionReferenceImageActions";
import type { Dictionary } from "@/types/i18n";

type Dict = Dictionary["dashboard"]["academicSectionPage"]["referenceImage"];

export function AcademicSectionReferenceImageEditor({
  locale,
  sectionId,
  imageUrl,
  dict,
}: {
  locale: string;
  sectionId: string;
  imageUrl: string | null;
  dict: Dict;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "reading" | "sending">("idle");
  const [readPct, setReadPct] = useState(0);

  function run(action: () => Promise<{ ok: boolean }>) {
    setError(null);
    start(async () => {
      const res = await action();
      if (!res.ok) {
        setError(dict.error);
        return;
      }
      setFile(null);
      setPhase("idle");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">{dict.label}</p>
      {imageUrl ? (
        <SectionReferenceThumb src={imageUrl} alt={dict.label} size="lg" />
      ) : (
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>
      )}
      <SectionReferenceImageField
        id="section-ref-image"
        file={file}
        onFileChange={(next, bad) => {
          setFile(next);
          setInvalid(bad);
          setError(bad ? dict.invalid : null);
        }}
        dict={{ photoLabel: dict.replace, photoInvalid: dict.invalid }}
        disabled={pending}
        progress={
          phase === "reading"
            ? { label: dict.uploadProgressReading, value: readPct }
            : phase === "sending"
              ? { label: dict.uploadProgressSending, indeterminate: true }
              : null
        }
      />
      {invalid ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {dict.invalid}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending || !file || invalid}
          isLoading={pending && phase !== "idle"}
          onClick={() => {
            if (!file) return;
            run(async () => {
              setPhase("reading");
              const { base64, mime } = await readImageFileAsBase64(file, {
                onProgress: (ratio) => setReadPct(Math.round(ratio * 100)),
              });
              setPhase("sending");
              return uploadSectionReferenceImageAction({
                locale,
                sectionId,
                imageBase64: base64,
                imageMime: mime,
              });
            });
          }}
        >
          {dict.replace}
        </Button>
        {imageUrl ? (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              run(() => removeSectionReferenceImageAction({ locale, sectionId }))
            }
          >
            {dict.remove}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
