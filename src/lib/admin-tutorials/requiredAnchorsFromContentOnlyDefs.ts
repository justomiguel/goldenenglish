import type { AdminTourAnchor } from "@/lib/admin-tutorials/selectors";
import type { ContentOnlyStepDef } from "@/lib/admin-tutorials/explainContentOnlyTour";

/** Always-visible (non-optional) anchors for L3 / runtime matrix smokes. */
export function requiredAnchorsFromContentOnlyDefs(
  defs: readonly ContentOnlyStepDef[],
): readonly AdminTourAnchor[] {
  return defs
    .filter(
      (d): d is ContentOnlyStepDef & { anchor: AdminTourAnchor } =>
        d.anchor != null && d.optional !== true,
    )
    .map((d) => d.anchor);
}
