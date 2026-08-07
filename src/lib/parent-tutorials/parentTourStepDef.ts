import type { ParentTourAnchor } from "@/lib/parent-tutorials/selectors";

export type ParentTourSurface = "desktop" | "mobile" | "both";

export type ParentTourStepDef = {
  anchor: ParentTourAnchor | null;
  title: string;
  description: string;
  /** Which app surfaces show this step. Default treated as both when omitted at filter time. */
  surfaces: ParentTourSurface[];
  /** Skip when the anchor is missing from the DOM. */
  optional?: boolean;
};
