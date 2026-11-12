import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { genericSectionStockPath } from "@/lib/theme/genericInstituteTemplates";
import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import {
  GENERIC_LANDING_SECTIONS,
  type GenericBandsLayout,
  type GenericLandingSection,
} from "@/lib/landing/genericLandingComposition";
import type { BandItem } from "@/variants/band/bandProps";
import BandAlternate from "@/variants/band/alternate/v1/Web";
import BandBreaks from "@/variants/band/breaks/v1/Web";
import BandCluster from "@/variants/band/cluster/v1/Web";
import BandPaper from "@/variants/band/paper/v1/Web";
import BandRuled from "@/variants/band/ruled/v1/Web";

const VIEWS = {
  alternate: BandAlternate,
  cluster: BandCluster,
  ruled: BandRuled,
  paper: BandPaper,
  breaks: BandBreaks,
} as const;

export function GenericLandingBands(props: {
  layout: GenericBandsLayout;
  kind: GenericInstituteKind;
  copy: GenericLandingCopy;
  sectionSrc?: Partial<Record<GenericLandingSection, string>>;
  sectionLabels?: Partial<Record<GenericLandingSection, string>>;
  hiddenSections?: ReadonlySet<string>;
}) {
  const items: BandItem[] = GENERIC_LANDING_SECTIONS.filter((section) => !props.hiddenSections?.has(section)).map(
    (section) => ({
      id: section,
      label: props.sectionLabels?.[section] ?? section,
      sentence: props.copy.sections[section],
      src: props.sectionSrc?.[section] ?? genericSectionStockPath(props.kind, section),
    }),
  );
  if (items.length === 0) return null;
  const View = VIEWS[props.layout];
  return <View items={items} />;
}
