import { InscriptionsSettingsForm } from "@/components/dashboard/InscriptionsSettingsForm";
import { PublicCtaModeSettingsForm } from "@/components/dashboard/PublicCtaModeSettingsForm";
import { getPublicCtaMode } from "@/lib/settings/getPublicCtaMode";
import {
  getInscriptionsEnabled,
  getRegisterSectionMode,
  loadRegistrationCohortConfig,
} from "@/lib/settings/inscriptionsServer";
import type { Dictionary } from "@/types/i18n";

interface AdminRegistrationsConfigPanelProps {
  locale: string;
  labels: Dictionary["admin"]["settings"];
}

export async function AdminRegistrationsConfigPanel({
  locale,
  labels,
}: AdminRegistrationsConfigPanelProps) {
  const [enabled, sectionMode, cohortConfig, publicCtaMode] = await Promise.all([
    getInscriptionsEnabled(),
    getRegisterSectionMode(),
    loadRegistrationCohortConfig(),
    getPublicCtaMode(),
  ]);

  return (
    <div className="space-y-2">
      <InscriptionsSettingsForm
        locale={locale}
        initialEnabled={enabled}
        initialSectionMode={sectionMode}
        labels={labels}
        cohortConfig={cohortConfig}
      />
      <PublicCtaModeSettingsForm locale={locale} initialMode={publicCtaMode} labels={labels} />
    </div>
  );
}
