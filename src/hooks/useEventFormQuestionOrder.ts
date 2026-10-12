"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateEventBaseFieldRequirementsAction,
  updateEventRegistrationFieldOrderAction,
} from "@/app/[locale]/dashboard/admin/events/eventRegistrationFieldActions";

export function useEventFormQuestionOrder(input: {
  locale: string;
  eventId: string;
  requirePhone: boolean;
  requireBirthDate: boolean;
  errorOrderSave: string;
  errorRequirementsSave: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reorder(tokens: string[]) {
    setError(null);
    startTransition(async () => {
      const result = await updateEventRegistrationFieldOrderAction({
        locale: input.locale,
        eventId: input.eventId,
        order: tokens,
      });
      if (!result.ok) {
        setError(input.errorOrderSave);
        return;
      }
      router.refresh();
    });
  }

  function setRequirement(kind: "phone" | "birthDate", checked: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await updateEventBaseFieldRequirementsAction({
        locale: input.locale,
        eventId: input.eventId,
        requirePhone: kind === "phone" ? checked : input.requirePhone,
        requireBirthDate: kind === "birthDate" ? checked : input.requireBirthDate,
      });
      if (!result.ok) {
        setError(input.errorRequirementsSave);
        return;
      }
      router.refresh();
    });
  }

  return { pending, error, reorder, setRequirement };
}
