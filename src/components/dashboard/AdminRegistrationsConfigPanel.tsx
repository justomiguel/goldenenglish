import { InscriptionsSettingsForm } from "@/components/dashboard/InscriptionsSettingsForm";
import { PublicCtaModeSettingsForm } from "@/components/dashboard/PublicCtaModeSettingsForm";
import { RegisterExtrasPackSettingsForm } from "@/components/dashboard/RegisterExtrasPackSettingsForm";
import { resolveActiveRegistrationExtrasPack } from "@/lib/register/packs/resolveActiveRegistrationExtrasPack";
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
  const [enabled, sectionMode, cohortConfig, publicCtaMode, extrasPack] = await Promise.all([
    getInscriptionsEnabled(),
    getRegisterSectionMode(),
    loadRegistrationCohortConfig(),
    getPublicCtaMode(),
    resolveActiveRegistrationExtrasPack(),
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
      <RegisterExtrasPackSettingsForm locale={locale} initialPack={extrasPack} labels={labels} />
      <PublicCtaModeSettingsForm locale={locale} initialMode={publicCtaMode} labels={labels} />
    </div>
  );
}
