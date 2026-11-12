import type { GenericLandingContactValue } from "@/components/organisms/GenericLandingContact";
import FooterGeneric from "@/variants/footer/generic/v1/Web";

export interface GenericLandingFooterProps {
  siteName: string;
  contact?: GenericLandingContactValue;
}

export function GenericLandingFooter(props: GenericLandingFooterProps) {
  return <FooterGeneric siteName={props.siteName} contact={props.contact} />;
}
