import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { LandingEditorOverviewItem } from "@/lib/cms/buildLandingEditorViewModel";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeRow } from "@/types/theming";
import { LandingTemplateKindPicker } from "./LandingTemplateKindPicker";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"];

export interface LandingEditorOverviewProps {
  locale: string;
  labels: Labels;
  theme: SiteThemeRow;
  sections: ReadonlyArray<LandingEditorOverviewItem>;
}

function formatSummary(template: string, count: number, total: number): string {
  return template
    .replace("{{count}}", String(count))
    .replace("{{total}}", String(total));
}

export function LandingEditorOverview({
  locale,
  labels,
  theme,
  sections,
}: LandingEditorOverviewProps) {
  return (
    <section className="space-y-6">
      <Link
        href={`/${locale}/dashboard/admin/cms/templates`}
        className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft aria-hidden className="mr-1 h-4 w-4" />
        {labels.backToTemplates}
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
          {labels.overviewTitle.replace("{{name}}", theme.name)}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)]">
          {labels.overviewLead}
        </p>
      </header>

      <LandingTemplateKindPicker
        locale={locale}
        themeId={theme.id}
        current={theme.templateKind}
        labels={labels.kindPicker}
      />

      <Link
        href={`/${locale}/dashboard/admin/cms/templates/${theme.id}/hero`}
        className="flex items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
      >
        <Sparkles aria-hidden className="h-5 w-5" />
        <span className="flex-1">{labels.heroEditor.openCta}</span>
        <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>

      <ul className="grid gap-3 sm:grid-cols-2">
        {sections.map((item) => {
          const sectionLabel = labels.sections[item.section];
          const copyLine = formatSummary(
            labels.copyOverridesSummary,
            item.copyOverridesCount,
            item.copyFieldsTotal,
          );
          const mediaLine = formatSummary(
            labels.mediaOverridesSummary,
            item.mediaOverridesCount,
            item.mediaSlotsTotal,
          );
          const blocksLine = labels.blocks.blocksSummary.replace(
            "{{count}}",
            String(item.blocksCount),
          );
          return (
            <li key={item.section}>
              <Link
                href={`/${locale}/dashboard/admin/cms/templates/${theme.id}/landing/${item.section}`}
                className="flex h-full flex-col justify-between rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-primary)]"
              >
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                    {sectionLabel}
                  </h2>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {copyLine}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {mediaLine}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {blocksLine}
                  </p>
                </div>
                <span className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]">
                  {labels.sectionLinkCta}
                  <ArrowRight aria-hidden className="ml-1 h-4 w-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
