import type { SendEmailInput } from "@/lib/email/emailProvider";
import { fillParentMailPlaceholders } from "@/lib/parents/fillParentMailPlaceholders";
import type { ParentMailMode, ParentRecipient } from "@/lib/parents/parentRecipient";

export type ParentBulkEmailPlan = {
  portalIds: string[];
  emails: SendEmailInput[];
  skippedSynthetic: number;
};

export function buildParentBulkEmailPlan(input: {
  parents: ParentRecipient[];
  mode: ParentMailMode;
  subject: string;
  html: string;
  fromAddress: string;
}): ParentBulkEmailPlan {
  const portalIds = input.parents.map((p) => p.id);
  const deliverable = input.parents.filter((p): p is ParentRecipient & { email: string } =>
    Boolean(p.email),
  );
  const skippedSynthetic = input.parents.length - deliverable.length;

  if (deliverable.length === 0) {
    return { portalIds, emails: [], skippedSynthetic };
  }

  if (input.mode === "individual") {
    return {
      portalIds,
      skippedSynthetic,
      emails: deliverable.map((p) => ({
        to: p.email,
        subject: fillParentMailPlaceholders(input.subject, p),
        html: fillParentMailPlaceholders(input.html, p),
      })),
    };
  }

  const addresses = deliverable.map((p) => p.email);
  const shared: SendEmailInput = {
    to: input.fromAddress,
    subject: input.subject,
    html: input.html,
  };
  if (input.mode === "cc") shared.cc = addresses;
  else shared.bcc = addresses;
  return { portalIds, skippedSynthetic, emails: [shared] };
}
