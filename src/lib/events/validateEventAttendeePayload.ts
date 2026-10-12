import { z } from "zod";
import { buildEventFieldValuesSchema } from "@/lib/events/eventFormFieldsSchema";
import { fieldsForRegistrationFlow } from "@/lib/events/registrationFlows";
import { resolveAttendeeIsMinor } from "@/lib/events/resolveAttendeeIsMinor";
import type {
  EventFieldPayloadEntry,
  EventFormFieldDefinition,
  EventRegistrationBasePayload,
  EventTutorPayload,
} from "@/lib/events/types";

const optionalBirthDate = z
  .union([
    z.literal("").transform(() => undefined),
    z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  ])
  .optional();

function buildBaseSchema(requirePhone: boolean, requireBirthDate: boolean) {
  return z.object({
    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().min(1).max(120),
    dniOrPassport: z.string().trim().min(1).max(40),
    email: z.string().trim().email().max(254),
    phone: requirePhone
      ? z.string().trim().min(1).max(40)
      : z.string().trim().max(40).optional(),
    birthDate: requireBirthDate
      ? z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/)
      : optionalBirthDate,
  });
}

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
  requirePhone?: boolean;
  requireBirthDate?: boolean;
  flowIds?: string[];
  flowId?: string | null;
  now?: Date;
}

export interface ValidateEventAttendeePayloadResult {
  base: z.infer<ReturnType<typeof buildBaseSchema>>;
  tutor: z.infer<typeof tutorSchema>;
  fieldValues: EventFieldPayloadEntry[];
  isMinor: boolean;
  flowId: string | null;
}

export function validateEventAttendeePayload(
  input: ValidateEventAttendeePayloadInput,
): ValidateEventAttendeePayloadResult {
  const collectBirthDate = input.collectBirthDate ?? false;
  const requireBirthDate = collectBirthDate && (input.requireBirthDate ?? false);
  const baseInput = collectBirthDate
    ? input.base
    : { ...input.base, birthDate: undefined };
  const parsedBase = buildBaseSchema(input.requirePhone ?? false, requireBirthDate).parse(baseInput);
  const parsedTutor = tutorSchema.parse(collectBirthDate ? input.tutor : {});
  const flowIds = input.flowIds ?? [];
  const flowSelection = fieldsForRegistrationFlow({
    fields: input.fields,
    flowIds,
    flowId: input.flowId,
  });
  if (flowIds.length > 1 && !flowSelection.flowId) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: "event_flow_required",
        path: ["flowId"],
      },
    ]);
  }
  const parsedFieldValues = buildEventFieldValuesSchema(flowSelection.fields).parse(input.fieldValues);

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
    flowId: flowSelection.flowId,
  };
}
