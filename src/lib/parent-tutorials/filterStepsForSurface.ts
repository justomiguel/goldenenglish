import type { ParentTourStepDef, ParentTourSurface } from "@/lib/parent-tutorials/parentTourStepDef";

export type ParentTourRuntimeSurface = "desktop" | "mobile";

/** Keep steps tagged for the active surface (`both` always kept). */
export function filterStepsForSurface(
  steps: ParentTourStepDef[],
  surface: ParentTourRuntimeSurface,
): ParentTourStepDef[] {
  return steps.filter((step) => {
    const tags: ParentTourSurface[] =
      step.surfaces.length > 0 ? step.surfaces : ["both"];
    return tags.includes("both") || tags.includes(surface);
  });
}
