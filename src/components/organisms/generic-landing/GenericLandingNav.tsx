import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import NavGeneric, { type NavVariantProps } from "@/variants/nav/generic/v1/Web";

export type GenericLandingNavItem = NavVariantProps["items"][number];
export type GenericLandingNavProps = Omit<NavVariantProps, "kind"> & { kind: GenericInstituteKind };

export function GenericLandingNav(props: GenericLandingNavProps) {
  return <NavGeneric {...props} />;
}
