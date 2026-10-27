import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { EventCompanionPayload, EventFieldPayloadEntry } from "@/lib/events/types";

export interface EventEnrollRequestTutor {
  tutorFirstName: string;
  tutorLastName: string;
  tutorDniOrPassport: string;
  tutorEmail: string;
  tutorPhone: string;
  tutorRelationship: string;
}

export function buildEventEnrollRequestBody(input: {
  locale: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  birthDate: string;
  isMinor: boolean;
  tutor: EventEnrollRequestTutor;
  fieldValues: EventFieldPayloadEntry[];
  isLocalResident: boolean;
  paymentMethod: EventRegistrationPaymentMethod;
  showPaymentPicker: boolean;
  flowId?: string | null;
  familyDiscountClaimed: boolean;
  discountCode?: string | null;
  transferOptionId?: string | null;
  transferSourceKey?: string | null;
  seatKeys?: string[];
  companions?: EventCompanionPayload[];
  minorTicketCount?: number;
}) {
  return {
    captchaToken: "manual-placeholder",
    locale: input.locale,
    base: {
      firstName: input.firstName,
      lastName: input.lastName,
      dniOrPassport: input.dni,
      email: input.email,
      phone: input.phone,
      ...(input.birthDate.trim() ? { birthDate: input.birthDate.trim() } : {}),
    },
    tutor: input.isMinor ? input.tutor : {},
    paymentMethod: input.showPaymentPicker ? input.paymentMethod : undefined,
    isLocalResident: input.isLocalResident,
    fieldValues: input.fieldValues,
    ...(input.flowId ? { flowId: input.flowId } : {}),
    familyDiscount: input.familyDiscountClaimed,
    discountCode: input.discountCode ?? undefined,
    ...(input.transferOptionId ? { transferOptionId: input.transferOptionId } : {}),
    ...(input.transferSourceKey ? { transferSourceKey: input.transferSourceKey } : {}),
    ...(input.seatKeys && input.seatKeys.length > 0 ? { seatKeys: input.seatKeys } : {}),
    ...(input.companions && input.companions.length > 0 ? { companions: input.companions } : {}),
    ...(input.minorTicketCount && input.minorTicketCount > 0
      ? { minorTicketCount: input.minorTicketCount }
      : {}),
  };
}
