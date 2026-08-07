import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { adminTourSelector } from "@/lib/admin-tutorials/selectors";

/** Drop optional steps whose anchors are missing from the document. */
export function filterTourStepsForDom(
  steps: AdminTourStepDef[],
  query: (selector: string) => Element | null = (sel) =>
    typeof document !== "undefined" ? document.querySelector(sel) : null,
): AdminTourStepDef[] {
  return steps.filter((step) => {
    if (!step.optional || step.anchor == null) return true;
    return query(adminTourSelector(step.anchor)) != null;
  });
}
