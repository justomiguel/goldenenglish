export type EventFormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "email"
  | "phone"
  | "select"
  | "file"
  | "image";

export interface EventFormFieldDefinition {
  id: string;
  fieldKey: string;
  fieldType: EventFormFieldType;
  labelI18n: Record<string, string>;
  helpTextI18n?: Record<string, string>;
  optionsI18n?: Record<string, string[]>;
  required: boolean;
  maxFileSizeBytes?: number;
  allowedMimeTypes?: string[];
}

export interface EventFieldPayloadEntry {
  fieldId: string;
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
  fileStoragePath?: string;
  fileSizeBytes?: number;
  fileMimeType?: string;
}

export interface EventRegistrationBasePayload {
  firstName: string;
  lastName: string;
  dniOrPassport: string;
  email: string;
  phone?: string;
  birthDate?: string;
}

/**
 * One extra seat on a purchase. Name is always required; the rest are per-event
 * toggles (D7), so they are absent unless the event asked for them.
 */
export interface EventCompanionPayload {
  firstName: string;
  lastName: string;
  dniOrPassport?: string;
  email?: string;
  birthDate?: string;
  fieldValues?: EventFieldPayloadEntry[];
}

export interface EventTutorPayload {
  tutorId?: string;
  tutorFirstName?: string;
  tutorLastName?: string;
  tutorDniOrPassport?: string;
  tutorEmail?: string;
  tutorPhone?: string;
  tutorRelationship?: string;
}
