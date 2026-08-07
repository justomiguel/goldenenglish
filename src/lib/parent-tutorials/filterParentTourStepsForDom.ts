import type { ParentTourStepDef } from "@/lib/parent-tutorials/parentTourStepDef";
import { parentTourSelector } from "@/lib/parent-tutorials/selectors";

/** Drop optional steps whose anchors are missing from the document. */
export function filterParentTourStepsForDom(
  steps: ParentTourStepDef[],
  query: (selector: string) => Element | null = (sel) =>
    typeof document !== "undefined" ? document.querySelector(sel) : null,
): ParentTourStepDef[] {
  return steps.filter((step) => {
    if (!step.optional || step.anchor == null) return true;
    return query(parentTourSelector(step.anchor)) != null;
  });
}
