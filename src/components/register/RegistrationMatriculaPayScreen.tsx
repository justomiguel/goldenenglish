import type { ReactNode } from "react";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { fillTemplate } from "@/lib/i18n/fillTemplate";
import type { RegistrationPayContext } from "@/lib/register/parseRegistrationPayContext";
import { registrationPayPageKind } from "@/lib/register/registrationPayPageKind";
import {
  RegistrationMatriculaPayActions,
  type RegistrationMatriculaPayActionLabels,
} from "@/components/register/RegistrationMatriculaPayActions";
import type { RegistrationPublicPayMethod } from "@/lib/register/resolveRegistrationPublicPayMethods";

export type RegistrationMatriculaPayLabels = {
  title: string;
  lead: string;
  full: string;
  alreadyIn: string;
  amount: string;
  noFee: string;
  needsSection: string;
  receiptPending: string;
  captured: string;
  capturedFull: string;
  noMethods: string;
  contact: string;
  whatsapp: string;
  noAlternatives: string;
  offerLead?: string;
  offerAccept?: string;
  offerGone?: string;
};

function OfferLeadText({ text }: { text: string }) {
  const parts = text.split("**");
  if (parts.length < 2) return text;
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

export type RegistrationMatriculaPayUi = {
  token: string;
  methods: RegistrationPublicPayMethod[];
  transferInstructions: string | null;
  alternatives: { id: string; label: string }[];
  whatsappUrl: string;
  contactEmail: string;
  actionLabels: RegistrationMatriculaPayActionLabels;
  variant?: "enrollment" | "trial";
};

function Shell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children}
    </section>
  );
}

function Contact({
  labels,
  whatsappUrl,
  contactEmail,
}: {
  labels: RegistrationMatriculaPayLabels;
  whatsappUrl: string;
  contactEmail: string;
}) {
  return (
    <p className="mt-4 text-sm">
      {labels.contact}
      {whatsappUrl ? (
        <>
          {" "}
          <a className="underline" href={whatsappUrl}>
            {labels.whatsapp}
          </a>
        </>
      ) : null}
      {contactEmail ? (
        <>
          {" "}
          <a className="underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </>
      ) : null}
    </p>
  );
}

export function RegistrationMatriculaPayScreen({
  locale,
  studentName,
  sectionLabel,
  proposedSectionLabel = "",
  context,
  sectionIsFull,
  labels,
  payUi,
}: {
  locale: string;
  studentName: string;
  sectionLabel: string;
  proposedSectionLabel?: string;
  context: RegistrationPayContext;
  sectionIsFull: boolean;
  labels: RegistrationMatriculaPayLabels;
  payUi?: RegistrationMatriculaPayUi;
}) {
  const hasProposed = Boolean(context.proposedSectionId);
  const kind = registrationPayPageKind({
    status: context.status,
    intakeState: context.intakeState,
    feeCaptured: context.feeCaptured,
    snapshotTotal: context.snapshotTotal,
    sectionIsFull,
    hasProposed,
    proposedIsFull: !hasProposed && context.intakeState === "offer_pending",
  });
  const amount =
    context.snapshotTotal > 0
      ? formatMoneyLabel(context.snapshotTotal, context.snapshotCurrency, locale)
      : null;
  const showSwitch =
    kind === "section_full" ||
    kind === "captured_full" ||
    kind === "no_fee" ||
    kind === "offer";
  const showPay = kind === "pay";
  const showContact =
    (showPay && (!payUi || payUi.methods.length === 0)) ||
    (showSwitch && (!payUi || payUi.alternatives.length === 0));

  if (kind === "enrolled") {
    return (
      <Shell title={labels.alreadyIn}>
        <p className="mt-3 text-[var(--color-muted-foreground)]">{sectionLabel}</p>
      </Shell>
    );
  }

  const proposed = proposedSectionLabel || sectionLabel;
  const leadCopy =
    kind === "offer" && labels.offerLead
      ? fillTemplate(labels.offerLead, {
          original: sectionLabel,
          proposed,
          schedule: proposed,
        })
      : kind === "needs_section"
        ? labels.needsSection
        : kind === "receipt_pending"
          ? labels.receiptPending
          : kind === "captured"
            ? labels.captured
            : kind === "captured_full"
              ? labels.capturedFull
              : kind === "section_full"
                ? labels.offerGone && context.intakeState === "offer_pending"
                  ? labels.offerGone
                  : labels.full
                : kind === "no_fee"
                  ? labels.noFee
                  : labels.lead;

  return (
    <Shell title={labels.title}>
      <p className="mt-3">
        {studentName} · {sectionLabel}
      </p>
      <p className="mt-3 text-[var(--color-muted-foreground)]">
        {kind === "offer" ? <OfferLeadText text={leadCopy} /> : leadCopy}
      </p>
      {kind === "pay" && amount ? (
        <p className="mt-6 text-lg font-medium">
          {labels.amount}: {amount}
        </p>
      ) : null}
      {showSwitch && payUi && payUi.alternatives.length === 0 ? (
        <p className="mt-4">{labels.noAlternatives}</p>
      ) : null}
      {payUi && (showPay || showSwitch) ? (
        <RegistrationMatriculaPayActions
          locale={locale}
          token={payUi.token}
          sectionLabel={sectionLabel}
          methods={payUi.methods}
          transferInstructions={payUi.transferInstructions}
          alternatives={payUi.alternatives}
          showPay={showPay}
          showSwitch={showSwitch && payUi.variant !== "trial"}
          proposedSectionId={kind === "offer" ? context.proposedSectionId : null}
          labels={{
            ...payUi.actionLabels,
            acceptOffer: payUi.actionLabels.acceptOffer ?? labels.offerAccept,
          }}
          variant={payUi.variant}
        />
      ) : null}
      {showContact && payUi ? (
        <Contact
          labels={labels}
          whatsappUrl={payUi.whatsappUrl}
          contactEmail={payUi.contactEmail}
        />
      ) : null}
    </Shell>
  );
}
