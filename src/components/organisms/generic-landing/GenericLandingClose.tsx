import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import type { GenericCloseLayout } from "@/lib/landing/genericLandingComposition";
import type { GenericLandingContactLabels, GenericLandingContactValue } from "@/components/organisms/GenericLandingContact";
import CloseNarrow from "@/variants/close/narrow/v1/Web";
import ClosePaper from "@/variants/close/paper/v1/Web";
import CloseQuiet from "@/variants/close/quiet/v1/Web";
import CloseStage from "@/variants/close/stage/v1/Web";
import CloseUnder from "@/variants/close/under/v1/Web";

const VIEWS = {
  paper: ClosePaper,
  quiet: CloseQuiet,
  narrow: CloseNarrow,
  stage: CloseStage,
  under: CloseUnder,
} as const;

export function GenericLandingClose({
  layout,
  copy,
  locale,
  contact,
  contactLabels,
}: {
  layout: GenericCloseLayout;
  copy: GenericLandingCopy;
  locale: string;
  contact?: GenericLandingContactValue;
  contactLabels?: GenericLandingContactLabels;
}) {
  const View = VIEWS[layout];
  return <View copy={copy} locale={locale} contact={contact} contactLabels={contactLabels} />;
}
