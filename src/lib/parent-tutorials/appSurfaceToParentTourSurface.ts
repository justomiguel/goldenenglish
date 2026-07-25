import type { AppSurface } from "@/hooks/useAppSurfaceCore";
import type { ParentTourRuntimeSurface } from "@/lib/parent-tutorials/filterStepsForSurface";

export function appSurfaceToParentTourSurface(
  surface: AppSurface,
): ParentTourRuntimeSurface {
  return surface === "web-desktop" ? "desktop" : "mobile";
}
