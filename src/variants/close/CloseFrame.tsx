import {
  GenericLandingContact,
  type GenericLandingContactLabels,
  type GenericLandingContactValue,
} from "@/components/organisms/GenericLandingContact";
import { GenericLandingMap } from "@/components/organisms/generic-landing/GenericLandingMap";
import { GenericLandingContactForm } from "@/components/organisms/generic-landing/GenericLandingContactForm";
import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import type { GenericCloseLayout } from "@/lib/landing/genericLandingComposition";

export interface CloseVariantProps {
  copy: GenericLandingCopy;
  locale: string;
  contact?: GenericLandingContactValue;
  contactLabels?: GenericLandingContactLabels;
}

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

export function CloseFrame({
  layout,
  copy,
  locale,
  contact,
  contactLabels,
}: CloseVariantProps & { layout: GenericCloseLayout }) {
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
      ) : null}
    </>
  );

  return (
    <section
      id="contacto"
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
