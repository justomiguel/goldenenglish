import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  GenericLandingContact,
  type GenericLandingContactLabels,
  type GenericLandingContactValue,
} from "@/components/organisms/GenericLandingContact";
import { GenericLandingContactForm } from "@/components/organisms/generic-landing/GenericLandingContactForm";
import { GenericLandingMap } from "@/components/organisms/generic-landing/GenericLandingMap";
import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import type { GenericCloseLayout } from "@/lib/landing/genericLandingComposition";

function hasShare(contact?: GenericLandingContactValue): boolean {
  if (!contact) return false;
  return Boolean(
    contact.email.trim() ||
      contact.phone.trim() ||
      contact.address.trim() ||
      contact.whatsapp.trim() ||
      contact.instagram?.trim() ||
      contact.facebook?.trim(),
  );
}

export function GenericLandingClose({
  layout,
  copy,
  locale,
  contact,
  contactLabels,
}: {
  layout: GenericCloseLayout;
  copy: GenericLandingCopy;
  locale: string;
  contact?: GenericLandingContactValue;
  contactLabels?: GenericLandingContactLabels;
}) {
  const stage = layout === "stage";
  const measure = layout === "narrow" || layout === "quiet" ? "max-w-xl" : "max-w-3xl";
  const pad = layout === "quiet" ? "py-28" : layout === "under" ? "pb-20 pt-6" : "py-20";
  const filled = hasShare(contact);
  const formLabels =
    contactLabels?.formName &&
    contactLabels.formEmail &&
    contactLabels.formPhone &&
    contactLabels.formMessage &&
    contactLabels.formSuccess &&
    contactLabels.formPreview &&
    contactLabels.formQuota &&
    contactLabels.formInvalid &&
    contactLabels.formPersist &&
    contactLabels.formUnavailable
      ? contactLabels
      : null;
  const linkOnStage = stage && !filled && !formLabels;

  const link = (
    <Link
      href={`/${locale}/contact`}
      className={`mt-8 inline-flex min-h-11 items-center gap-2 text-base font-semibold ${
        linkOnStage ? "text-[var(--color-primary-foreground)]" : "text-[var(--color-primary)]"
      }`}
    >
      <ArrowRight className="h-4 w-4" aria-hidden />
      {copy.cta}
    </Link>
  );

  const reach = (
    <>
      <GenericLandingContact contact={contact} labels={contactLabels} />
      <GenericLandingMap address={contact?.address ?? ""} title={contactLabels?.mapTitle ?? ""} />
      {formLabels ? (
        <GenericLandingContactForm
          locale={locale}
          labels={{
            formName: formLabels.formName ?? "",
            formEmail: formLabels.formEmail ?? "",
            formPhone: formLabels.formPhone ?? "",
            formMessage: formLabels.formMessage ?? "",
            formSuccess: formLabels.formSuccess ?? "",
            formPreview: formLabels.formPreview ?? "",
            formQuota: formLabels.formQuota ?? "",
            formInvalid: formLabels.formInvalid ?? "",
            formPersist: formLabels.formPersist ?? "",
            formUnavailable: formLabels.formUnavailable ?? "",
          }}
          submitLabel={copy.cta}
        />
      ) : (
        link
      )}
    </>
  );

  return (
    <section
      data-close-layout={layout}
      className={
        stage
          ? `bg-[var(--color-primary)] px-5 text-[var(--color-primary-foreground)] ${pad}`
          : `bg-[var(--color-background)] px-5 ${pad}`
      }
    >
      <div className={`mx-auto ${measure}`}>
        <h2 className="text-3xl font-medium tracking-tight">{copy.laterTitle}</h2>
        <p className={`mt-4 text-base leading-relaxed ${stage ? "" : "text-[var(--color-muted-foreground)]"}`}>
          {copy.laterBody}
        </p>
        {stage && (filled || formLabels) ? (
          <div className="mt-8 bg-[var(--color-background)] px-6 py-6 text-[var(--color-foreground)]">{reach}</div>
        ) : (
          reach
        )}
      </div>
    </section>
  );
}
