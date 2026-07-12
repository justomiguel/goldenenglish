import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import type { AdminTourAnchor } from "@/lib/admin-tutorials/selectors";

export type ExplainStepCopy = {
  title: string;
  description: string;
};

export type ExplainTourChromeCopy = {
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export type ContentOnlyStepDef = {
  /** Key under `steps` in the screen tour dictionary. */
  key: string;
  anchor: AdminTourAnchor | null;
  optional?: boolean;
};

/**
 * Builds intro → anchored regions → closing for content-only explain tours.
 * `copy.steps[key]` must exist for every def key.
 */
export function buildContentOnlyExplainSteps(
  stepsCopy: Record<string, ExplainStepCopy>,
  defs: readonly ContentOnlyStepDef[],
): AdminTourStepDef[] {
  return defs.map((def) => {
    const step = stepsCopy[def.key];
    if (!step) {
      throw new Error(`Missing explain-tour step copy for key: ${def.key}`);
    }
    return {
      anchor: def.anchor,
      title: step.title,
      description: step.description,
      ...(def.optional ? { optional: true } : {}),
    };
  });
}
