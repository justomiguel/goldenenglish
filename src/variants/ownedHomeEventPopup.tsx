import type { ComponentProps } from "react";
import { HomeEventPopup } from "@/components/organisms/HomeEventPopup";
import { HomeEventPopupOrInline } from "@/components/organisms/HomeEventPopupOrInline";
import { lioraHomeEventPopup } from "@/variants/owned/liora/homeEventPopup";

type PopupProps = ComponentProps<typeof HomeEventPopup>;

export function HomeEventPopupForKind({ kind, ...props }: PopupProps & { kind: string }) {
  if (kind === lioraHomeEventPopup.owner) return <HomeEventPopupOrInline {...props} />;
  return <HomeEventPopup {...props} />;
}
