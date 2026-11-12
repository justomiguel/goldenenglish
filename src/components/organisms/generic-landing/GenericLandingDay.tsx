import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import type { GenericDayLayout } from "@/lib/landing/genericLandingComposition";
import ScheduleProspectus from "@/variants/schedule/prospectus/v1/Web";
import ScheduleRecital from "@/variants/schedule/recital/v1/Web";
import ScheduleRows from "@/variants/schedule/rows/v1/Web";
import ScheduleRule from "@/variants/schedule/rule/v1/Web";
import ScheduleSteps from "@/variants/schedule/steps/v1/Web";

const VIEWS = {
  rows: ScheduleRows,
  rule: ScheduleRule,
  prospectus: ScheduleProspectus,
  recital: ScheduleRecital,
  steps: ScheduleSteps,
} as const;

export function GenericLandingDay({ layout, copy }: { layout: GenericDayLayout; copy: GenericLandingCopy }) {
  const View = VIEWS[layout];
  return <View lines={[copy.rhythmA, copy.rhythmB, copy.rhythmC]} />;
}
