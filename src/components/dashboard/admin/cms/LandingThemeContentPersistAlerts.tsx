"use client";

import type { SiteThemeActionErrorCode } from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"];

export interface LandingThemeContentPersistAlertsProps {
  labels: Labels;
  errorCode: SiteThemeActionErrorCode | null;
  savedAt: number | null;
  pending: boolean;
}

/** Shared success / error banners after landing CMS copy mutations. */
export function LandingThemeContentPersistAlerts({
  labels,
  errorCode,
  savedAt,
  pending,
}: LandingThemeContentPersistAlertsProps) {
  return (
    <>
      {errorCode ? (
        <p
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {labels.errors[errorCode] ?? labels.errors.persist_failed}
        </p>
      ) : null}
      {savedAt && !pending && !errorCode ? (
        <p
          role="status"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 px-3 py-2 text-sm text-[var(--color-success)]"
        >
          {labels.saveCopySuccess}
        </p>
      ) : null}
    </>
  );
}
