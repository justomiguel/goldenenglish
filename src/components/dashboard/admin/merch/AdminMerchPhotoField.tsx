"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { performShopMediaFileUpload } from "@/components/dashboard/admin/merch/performShopMediaFileUpload";
import { TrackedFileUploadModal } from "@/components/molecules/TrackedFileUploadModal";
import { useTrackedFileUpload } from "@/hooks/useTrackedFileUpload";
import type { AdminMerchLabels } from "@/components/dashboard/admin/merch/adminMerchTypes";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

const ACCEPT = "image/png,image/jpeg,image/webp";

interface AdminMerchPhotoFieldProps {
  productId: string;
  imageUrl: string | null;
  labels: AdminMerchLabels;
  fileUploadProgress: FileUploadProgressLabels;
  disabled?: boolean;
  onUploaded: (storagePath: string) => Promise<void>;
}

export function AdminMerchPhotoField({
  productId,
  imageUrl,
  labels,
  fileUploadProgress,
  disabled,
  onUploaded,
}: AdminMerchPhotoFieldProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { snapshot, isUploading, uploadFiles } = useTrackedFileUpload();

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    const [uploaded] = await uploadFiles([file], (current, onProgress) =>
      performShopMediaFileUpload(current, productId, onProgress),
    );
    if (!uploaded) {
      setError(labels.photoError);
      return;
    }
    await onUploaded(uploaded.storagePath);
  }

  return (
    <div>
      <Label htmlFor="merch-photo">{labels.createPhoto}</Label>
      <div className="mt-2 flex items-center gap-3">
        {imageUrl ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-[var(--color-muted)]">
            <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />
          </div>
        ) : null}
        <input
          ref={fileRef}
          id="merch-photo"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={disabled || isUploading}
          onChange={(e) => void onChange(e)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || isUploading}
          isLoading={isUploading}
          title={labels.tipCreatePhoto}
          className="min-h-[44px]"
          onClick={() => fileRef.current?.click()}
        >
          {isUploading ? null : <ImagePlus className="h-4 w-4 shrink-0" aria-hidden />}
          {isUploading ? labels.photoUploading : labels.photoChoose}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{error}</p> : null}
      <TrackedFileUploadModal snapshot={snapshot} labels={fileUploadProgress} />
    </div>
  );
}
