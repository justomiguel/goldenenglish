import { parseMozarthitosTenantExtras } from "@/lib/register/packs/mozarthitos/parseMozarthitosTenantExtras";
import { mozarthitosGuideSummaryParts } from "@/lib/register/packs/mozarthitos/formatMozarthitosGuideSummary";
import type { Dictionary } from "@/types/i18n";

type GuideLabels = Dictionary["admin"]["registrations"]["mozarthitosGuide"];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

export function AdminRegistrationFamilyGuide({
  tenantExtras,
  labels,
}: {
  tenantExtras: unknown;
  labels: GuideLabels;
}) {
  const extras = parseMozarthitosTenantExtras(tenantExtras);
  if (!extras) return null;
  const parts = mozarthitosGuideSummaryParts(extras.guide, labels);

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-semibold">{labels.title}</p>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <Field label={labels.stage} value={parts.stage} />
        <Field label={labels.modality} value={parts.modality} />
        <Field label={labels.ageBand} value={parts.ageBand} />
      </dl>
    </div>
  );
}
