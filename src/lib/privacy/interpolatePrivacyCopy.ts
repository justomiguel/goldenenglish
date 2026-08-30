export interface PrivacyCopyVars {
  brand: string;
  email: string;
  phone: string;
  address: string;
  registry: string;
}

export function interpolatePrivacyCopy(text: string, vars: PrivacyCopyVars): string {
  return text
    .replaceAll("{{brand}}", vars.brand)
    .replaceAll("{{email}}", vars.email)
    .replaceAll("{{phone}}", vars.phone)
    .replaceAll("{{address}}", vars.address)
    .replaceAll("{{registry}}", vars.registry);
}
