import type { ParentHubModel } from "@/types/parentHub";
import type { Dictionary } from "@/types/i18n";
import { ParentHubLogisticsTable } from "@/components/parent/ParentHubLogisticsTable";
import { ParentHubIcsDownload } from "@/components/parent/ParentHubIcsDownload";

interface ParentCalendarExtrasProps {
  hub: ParentHubModel;
  dict: Dictionary["dashboard"]["parent"]["hub"];
}

export function ParentCalendarExtras({ hub, dict }: ParentCalendarExtrasProps) {
  return (
    <div className="mt-8 space-y-6 border-t border-[var(--color-border)] pt-8">
      <ParentHubLogisticsTable
        rows={hub.logisticsRows}
        scheduleOverlap={hub.scheduleOverlap}
        dict={dict}
      />
      {hub.icsDocument ? (
        <div className="flex flex-wrap items-center gap-3">
          <ParentHubIcsDownload icsDocument={hub.icsDocument} dict={dict} />
        </div>
      ) : null}
    </div>
  );
}
