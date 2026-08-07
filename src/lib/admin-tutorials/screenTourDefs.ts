import type { ContentOnlyStepDef } from "@/lib/admin-tutorials/explainContentOnlyTour";
import type { AdminScreenTourId } from "@/lib/admin-tutorials/screenCatalog";
import { SCREEN_TOUR_DEFS_ACADEMIC_CMS } from "@/lib/admin-tutorials/screenTourDefsAcademicCms";
import { SCREEN_TOUR_DEFS_PEOPLE_FINANCE } from "@/lib/admin-tutorials/screenTourDefsPeopleFinance";

export type ContentOnlyScreenTourId = Exclude<AdminScreenTourId, "admin-home">;

/**
 * Ordered content-only step definitions (intro + regions + closing).
 * Anchors must exist on the matching page shell (rule 33).
 */
export const CONTENT_ONLY_SCREEN_TOUR_DEFS: Record<
  ContentOnlyScreenTourId,
  readonly ContentOnlyStepDef[]
> = {
  ...SCREEN_TOUR_DEFS_PEOPLE_FINANCE,
  ...SCREEN_TOUR_DEFS_ACADEMIC_CMS,
};

export function getContentOnlyScreenTourDefs(
  id: ContentOnlyScreenTourId,
): readonly ContentOnlyStepDef[] {
  return CONTENT_ONLY_SCREEN_TOUR_DEFS[id];
}
