import ContactMap from "@/variants/contact/map/v1/Web";

export function GenericLandingMap({ address, title }: { address: string; title: string }) {
  return <ContactMap address={address} title={title} />;
}
