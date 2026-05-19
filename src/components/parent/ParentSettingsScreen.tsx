import type { Dictionary } from "@/types/i18n";
import { PwaGroupedSection } from "@/components/pwa/molecules/PwaGroupedSection";
import { LanguageSwitcherPwaList } from "@/components/pwa/molecules/LanguageSwitcherPwaList";

export interface ParentSettingsScreenProps {
  locale: string;
  labels: Dictionary["dashboard"]["parent"]["settings"];
  localeSwitcher: Dictionary["common"]["locale"];
}

export function ParentSettingsScreen({
  locale,
  labels,
  localeSwitcher,
}: ParentSettingsScreenProps) {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-xl font-bold text-[var(--color-foreground)]">
          {labels.pageTitle}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.pageLead}</p>
      </header>

      <PwaGroupedSection title={localeSwitcher.label} footer={labels.languageHint}>
        <LanguageSwitcherPwaList locale={locale} labels={localeSwitcher} />
      </PwaGroupedSection>
    </div>
  );
}
