export interface PrivacyControllerInput {
  legalName: string;
  name: string;
  legalRegistry: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

export function privacyControllerFields(brand: PrivacyControllerInput) {
  return {
    brand: brand.legalName.trim() || brand.name.trim(),
    registry: brand.legalRegistry.trim(),
    email: brand.contactEmail.trim(),
    phone: brand.contactPhone.trim(),
    address: brand.contactAddress.trim(),
  };
}
