interface CentroListoJsonLdProps {
  name: string;
  description: string;
  url: string;
  logoUrl: string;
}

export function centrolistoOrganizationLd(input: CentroListoJsonLdProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    description: input.description,
    url: input.url,
    logo: input.logoUrl,
  };
}

/** Schema.org Organization for the Centro Listo host. */
export function CentroListoJsonLd(input: CentroListoJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(centrolistoOrganizationLd(input)) }}
    />
  );
}
