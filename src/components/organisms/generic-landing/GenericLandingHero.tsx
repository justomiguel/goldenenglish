import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import type { GenericHeroLayout } from "@/lib/landing/genericLandingComposition";
import type { HeroVariantProps } from "@/variants/hero/heroProps";
import HeroBleed from "@/variants/hero/bleed/v1/Web";
import HeroMasthead from "@/variants/hero/masthead/v1/Web";
import HeroSplit from "@/variants/hero/split/v1/Web";
import HeroStage from "@/variants/hero/stage/v1/Web";
import HeroTitle from "@/variants/hero/title/v1/Web";

const VIEWS = {
  bleed: HeroBleed,
  split: HeroSplit,
  masthead: HeroMasthead,
  stage: HeroStage,
  title: HeroTitle,
} as const;

export function GenericLandingHero({
  layout,
  copy,
  heroSrc,
}: {
  layout: GenericHeroLayout;
  copy: GenericLandingCopy;
  heroSrc: string;
}) {
  const props: HeroVariantProps = {
    scene: copy.scene,
    title: copy.title,
    body: copy.body,
    imageAlt: copy.imageAlt,
    name: copy.name,
    heroSrc,
  };
  const View = VIEWS[layout];
  return <View {...props} />;
}
