"use client";

import { useRouter } from "next/navigation";
import { LandingMediaSlotEditor } from "@/components/dashboard/admin/cms/LandingMediaSlotEditor";
import type { GenericSitePhotoSlot } from "@/lib/cms/loadSiteThemeForLandingEditor";
import { genericSectionNames } from "@/lib/landing/genericSectionNames";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

export function GenericSitePhotos({
  locale,
  themeId,
  photos,
  dict,
  fileUploadProgress,
}: {
  locale: string;
  themeId: string;
  photos: readonly GenericSitePhotoSlot[];
  dict: Dictionary;
  fileUploadProgress: FileUploadProgressLabels;
}) {
  const router = useRouter();
  const names = genericSectionNames(dict);
  const labels = dict.pulsar.account.siteCopy;
  if (photos.length === 0) return null;

  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-lg font-medium">{labels.photosTitle}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.photosLead}</p>
      <div className="space-y-3">
        {photos.map((photo) => (
          <LandingMediaSlotEditor
            key={photo.section}
            locale={locale}
            themeId={themeId}
            section={photo.section}
            slot={photo.slot}
            labels={dict.admin.cms.templates.landing}
            fileUploadProgress={fileUploadProgress}
            heading={names[photo.section]}
            onChanged={() => router.refresh()}
          />
        ))}
      </div>
    </section>
  );
}
