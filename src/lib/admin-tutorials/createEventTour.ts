import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type CreateEventTourStepCopy = { title: string; description: string };

export type CreateEventTourCopy = {
  intro: CreateEventTourStepCopy;
  createCta: CreateEventTourStepCopy;
  form: CreateEventTourStepCopy;
  titleField: CreateEventTourStepCopy;
  dateField: CreateEventTourStepCopy;
  pricing: CreateEventTourStepCopy;
  submitGuide: CreateEventTourStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export function buildCreateEventTourSteps(
  copy: CreateEventTourCopy,
  opts: { includeListCta: boolean },
): AdminTourStepDef[] {
  const steps: AdminTourStepDef[] = [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
  ];
  if (opts.includeListCta) {
    steps.push({
      anchor: ADMIN_TOUR_ANCHORS.eventsCreateCta,
      title: copy.createCta.title,
      description: copy.createCta.description,
      optional: true,
    });
  }
  steps.push(
    {
      anchor: ADMIN_TOUR_ANCHORS.eventCreateForm,
      title: copy.form.title,
      description: copy.form.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.eventCreateTitle,
      title: copy.titleField.title,
      description: copy.titleField.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.eventCreateDate,
      title: copy.dateField.title,
      description: copy.dateField.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.eventCreatePricing,
      title: copy.pricing.title,
      description: copy.pricing.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.eventCreateSubmit,
      title: copy.submitGuide.title,
      description: copy.submitGuide.description,
    },
  );
  return steps;
}
