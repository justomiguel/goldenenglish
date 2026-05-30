export interface EventAttendeesExportColumnLabels {
  name: string;
  dni: string;
  email: string;
  phone: string;
  birthDate: string;
  status: string;
  payment: string;
  residency: string;
  source: string;
  registered: string;
  tutorName: string;
  tutorDni: string;
  tutorEmail: string;
  tutorPhone: string;
  tutorRelationship: string;
  statusLabels: Record<string, string>;
  paymentLabels: Record<string, string>;
  residencyLabels: { local: string; nonLocal: string };
  sourceLabels: Record<string, string>;
  noPhone: string;
  noBirthDate: string;
  noPayment: string;
  emptyValue: string;
}

export interface EventAttendeesExportMetaLabels {
  documentTitle: string;
  eventDate: string;
  exportedAt: string;
  attendeeCount: string;
  sheetName: string;
}

export interface EventAttendeesExportBrandHeader {
  instituteName: string;
  legalName: string;
  legalRegistry: string;
  logoUrl: string;
  primaryColor: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

export interface EventAttendeesExportEventHeader {
  title: string;
  eventDateFormatted: string;
  coverImageUrl: string | null;
  location: string | null;
}

export interface EventAttendeesExportCustomColumn {
  fieldKey: string;
  label: string;
}

export interface EventAttendeesExportTable {
  headers: string[];
  rows: string[][];
}

export interface EventAttendeesExportArtifact {
  filename: string;
  mimeType: string;
  base64: string;
}
