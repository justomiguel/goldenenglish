import type { ParentTourStepDef } from "@/lib/parent-tutorials/parentTourStepDef";
import type { ParentTourAnchor } from "@/lib/parent-tutorials/selectors";
import type { ParentTourSurface } from "@/lib/parent-tutorials/parentTourStepDef";

export type ExplainStepCopy = {
  title: string;
  description: string;
};

export type ParentContentOnlyStepDef = {
  key: string;
  anchor: ParentTourAnchor | null;
  optional?: boolean;
  surfaces?: ParentTourSurface[];
};

/**
 * Builds content-only explain steps from dictionary step keys.
 * Defaults surfaces to `both`.
 */
export function buildParentContentOnlyExplainSteps(
  stepsCopy: Record<string, ExplainStepCopy>,
  defs: readonly ParentContentOnlyStepDef[],
): ParentTourStepDef[] {
  return defs.map((def) => {
    const step = stepsCopy[def.key];
    if (!step) {
      throw new Error(`Missing parent explain-tour step copy for key: ${def.key}`);
    }
    return {
      anchor: def.anchor,
      title: step.title,
      description: step.description,
      surfaces: def.surfaces ?? ["both"],
      ...(def.optional ? { optional: true } : {}),
    };
  });
}
