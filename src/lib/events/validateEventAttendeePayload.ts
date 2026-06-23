import { z } from "zod";
import { buildEventFieldValuesSchema } from "@/lib/events/eventFormFieldsSchema";
import { resolveAttendeeIsMinor } from "@/lib/events/resolveAttendeeIsMinor";
import type {
  EventFieldPayloadEntry,
  EventFormFieldDefinition,
  EventRegistrationBasePayload,
  EventTutorPayload,
} from "@/lib/events/types";

const baseSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  dniOrPassport: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional(),
  birthDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const tutorSchema = z.object({
  tutorId: z.string().uuid().optional(),
  tutorFirstName: z.string().trim().max(120).optional(),
  tutorLastName: z.string().trim().max(120).optional(),
  tutorDniOrPassport: z.string().trim().max(40).optional(),
  tutorEmail: z.string().trim().email().max(254).optional(),
  tutorPhone: z.string().trim().max(40).optional(),
  tutorRelationship: z.string().trim().max(80).optional(),
});

export interface ValidateEventAttendeePayloadInput {
  base: EventRegistrationBasePayload;
  tutor: EventTutorPayload;
  fieldValues: EventFieldPayloadEntry[];
  fields: EventFormFieldDefinition[];
  legalAgeMajority: number;
  collectBirthDate?: boolean;
  now?: Date;
}

export interface ValidateEventAttendeePayloadResult {
  base: z.infer<typeof baseSchema>;
  tutor: z.infer<typeof tutorSchema>;
  fieldValues: EventFieldPayloadEntry[];
  isMinor: boolean;
}

export function validateEventAttendeePayload(
  input: ValidateEventAttendeePayloadInput,
): ValidateEventAttendeePayloadResult {
  const collectBirthDate = input.collectBirthDate ?? false;
  const baseInput = collectBirthDate
    ? input.base
    : { ...input.base, birthDate: undefined };
  const parsedBase = baseSchema.parse(baseInput);
  const parsedTutor = tutorSchema.parse(collectBirthDate ? input.tutor : {});
  const parsedFieldValues = buildEventFieldValuesSchema(input.fields).parse(input.fieldValues);

  const isMinor = collectBirthDate
    ? resolveAttendeeIsMinor(parsedBase.birthDate, input.legalAgeMajority, input.now)
    : false;
  if (isMinor) {
    const hasTutorId = Boolean(parsedTutor.tutorId);
    const hasTutorData =
      Boolean(parsedTutor.tutorFirstName?.trim()) &&
      Boolean(parsedTutor.tutorLastName?.trim()) &&
      Boolean(parsedTutor.tutorDniOrPassport?.trim()) &&
      Boolean(parsedTutor.tutorEmail?.trim()) &&
      Boolean(parsedTutor.tutorPhone?.trim()) &&
      Boolean(parsedTutor.tutorRelationship?.trim());
    if (!hasTutorId && !hasTutorData) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: "event_tutor_required",
          path: ["tutor"],
        },
      ]);
    }
  }

  return {
    base: parsedBase,
    tutor: parsedTutor,
    fieldValues: parsedFieldValues,
    isMinor,
  };
}
