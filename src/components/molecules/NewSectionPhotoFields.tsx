"use client";

import { SectionReferenceImageField } from "@/components/molecules/SectionReferenceImageField";

export function NewSectionPhotoFields({
  file,
  invalid,
  disabled,
  phase,
  pct,
  dict,
  onFileChange,
}: {
  file: File | null;
  invalid: boolean;
  disabled: boolean;
  phase: "idle" | "reading" | "sending";
  pct: number;
  dict: {
    photoLabel: string;
    photoHint: string;
    photoInvalid: string;
    uploadProgressReading: string;
    uploadProgressSending: string;
  };
  onFileChange: (file: File | null, invalid: boolean) => void;
}) {
  return (
    <div className="mt-3">
      <SectionReferenceImageField
        id="ns-photo"
        file={file}
        onFileChange={onFileChange}
        dict={dict}
        disabled={disabled}
        progress={
          phase === "reading"
            ? { label: dict.uploadProgressReading, value: pct }
            : phase === "sending"
              ? { label: dict.uploadProgressSending, indeterminate: true }
              : null
        }
      />
      {invalid ? (
        <p className="mt-1 text-sm text-[var(--color-error)]" role="alert">
          {dict.photoInvalid}
        </p>
      ) : null}
    </div>
  );
}
