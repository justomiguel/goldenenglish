"use client";

import { Activity } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { SiteSetupOperationalValues } from "@/lib/site/loadSiteSetupCurrentValues";

type L = Dictionary["dashboard"]["siteSetup"]["analytics"];

interface SiteSetupAnalyticsStepProps {
  labels: L;
  operational: SiteSetupOperationalValues;
  update: <K extends keyof SiteSetupOperationalValues>(
    key: K,
    value: SiteSetupOperationalValues[K],
  ) => void;
}

export function SiteSetupAnalyticsStep({
  labels,
  operational,
  update,
}: SiteSetupAnalyticsStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity
          className="h-5 w-5 text-[var(--color-primary)]"
          aria-hidden
        />
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h2>
      </div>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.lead}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="analytics-namespace">{labels.eventNamespace}</Label>
          <Input
            id="analytics-namespace"
            className="mt-1"
            value={operational.analyticsEventNamespace}
            onChange={(e) =>
              update("analyticsEventNamespace", e.target.value)
            }
            placeholder="goldenenglish"
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.eventNamespaceHint}
          </p>
        </div>
        <div>
          <Label htmlFor="analytics-version">{labels.eventVersion}</Label>
          <Input
            id="analytics-version"
            className="mt-1"
            value={operational.analyticsEventVersion}
            onChange={(e) => update("analyticsEventVersion", e.target.value)}
            placeholder="1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="analytics-tz">{labels.timezone}</Label>
        <Input
          id="analytics-tz"
          className="mt-1"
          value={operational.analyticsTimezone}
          onChange={(e) => update("analyticsTimezone", e.target.value)}
          placeholder="America/Argentina/Cordoba"
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {labels.timezoneHint}
        </p>
      </div>
    </div>
  );
}
