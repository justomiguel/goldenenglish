import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadEventForPublicLanding } from "@/lib/dashboard/events/loadEventForPublicLanding";
import { loadEventRegistrationPaymentMethods } from "@/lib/events/server/loadEventRegistrationPaymentMethods";
import { loadBankTransferInstructionsSetting } from "@/lib/billing/loadBankTransferInstructionsSetting";
import { resolveBankTransferInstructions } from "@/lib/billing/resolveBankTransferInstructions";
import { resolveSessionEventAdminEditHref } from "@/lib/dashboard/events/resolveSessionEventAdminEditHref";
import { fillEventTransferReceiptMaxMbTemplate } from "@/lib/events/eventTransferReceiptLimits";
import { EventRegisterSurfaceEntry } from "@/components/organisms/EventRegisterSurfaceEntry";
import { PublicEventAdminEditLink } from "@/components/molecules/PublicEventAdminEditLink";
import { loadPublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventRegisterPageClasses } from "@/lib/events/publicEventSurfaceClasses";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function EventRegisterPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const [event, surfaceVariant] = await Promise.all([
    loadEventForPublicLanding(supabase, slug, locale),
    loadPublicEventSurfaceVariant(),
  ]);
  if (!event) notFound();

  const paymentMethods = await loadEventRegistrationPaymentMethods(event.currency);
  const { instructions: globalBankTransferInstructions } =
    await loadBankTransferInstructionsSetting(supabase);
  const eventForRegister = {
    ...event,
    bankTransferInstructions: resolveBankTransferInstructions(
      event.bankTransferInstructions,
      globalBankTransferInstructions,
    ),
  };
  const adminEditHref = await resolveSessionEventAdminEditHref(supabase, locale, event.id);
  const pageClasses = publicEventRegisterPageClasses(surfaceVariant);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/${locale}/events/${event.slug}`}
          className={pageClasses.backLink}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {dict.events.register.backToEvent}
        </Link>
        {adminEditHref ? (
          <PublicEventAdminEditLink
            href={adminEditHref}
            label={dict.events.public.adminEdit}
            ariaLabel={dict.events.public.adminEditAriaLabel}
          />
        ) : null}
      </div>

      <div className="space-y-3">
        <h1 className={pageClasses.title}>{dict.events.register.title}</h1>
        <p className={pageClasses.lead}>{dict.events.register.lead}</p>
      </div>
      <EventRegisterSurfaceEntry
        locale={locale}
        event={eventForRegister}
        paymentMethods={paymentMethods}
        surfaceVariant={surfaceVariant}
        labels={{
          participantSection: dict.events.register.participantSection,
          firstName: dict.events.register.firstName,
          lastName: dict.events.register.lastName,
          dni: dict.events.register.dni,
          email: dict.events.register.email,
          phone: dict.events.register.phone,
          birthDate: dict.events.register.birthDate,
          submit: dict.events.register.submit,
          consent: dict.events.register.consent,
          error: dict.events.register.error,
          successModal: dict.events.register.successModal,
          captchaRequired: dict.events.register.captchaRequired,
          tutor: {
            title: dict.events.register.tutor.title,
            firstName: dict.events.register.tutor.firstName,
            lastName: dict.events.register.tutor.lastName,
            dni: dict.events.register.tutor.dni,
            email: dict.events.register.tutor.email,
            phone: dict.events.register.tutor.phone,
            relationship: dict.events.register.tutor.relationship,
          },
          payment: {
            title: dict.events.register.payment.title,
            flow: dict.events.register.payment.flow,
            mercadopago: dict.events.register.payment.mercadopago,
            transfer: dict.events.register.payment.transfer,
            startFailed: dict.events.register.payment.startFailed,
          },
          residency: {
            title: dict.events.register.residency.title,
            local: dict.events.register.residency.local,
            nonLocal: dict.events.register.residency.nonLocal,
            localPrice: dict.events.register.residency.localPrice,
            nonLocalPrice: dict.events.register.residency.nonLocalPrice,
          },
          transferReceipt: {
            title: dict.events.register.transferReceipt.title,
            button: dict.events.register.transferReceipt.button,
            hint: fillEventTransferReceiptMaxMbTemplate(dict.events.register.transferReceipt.hint),
            noFile: dict.events.register.transferReceipt.noFile,
            required: dict.events.register.transferReceipt.required,
            tooLarge: fillEventTransferReceiptMaxMbTemplate(
              dict.events.register.transferReceipt.tooLarge,
            ),
            invalidType: dict.events.register.transferReceipt.invalidType,
            uploadFailed: dict.events.register.transferReceipt.uploadFailed,
            inputAriaLabel: dict.events.register.transferReceipt.inputAriaLabel,
          },
          transferInstructions: {
            title: dict.events.register.transferInstructions.title,
          },
          selectPlaceholder: dict.events.register.selectPlaceholder,
          fileUploadProgressSending: dict.common.fileUpload.progressSending,
          customFieldFile: {
            fileButton: dict.events.register.customFieldFile.fileButton,
            imageButton: dict.events.register.customFieldFile.imageButton,
            noFile: dict.events.register.customFieldFile.noFile,
            required: dict.events.register.customFieldFile.required,
            tooLarge: dict.events.register.customFieldFile.tooLarge,
            invalidType: dict.events.register.customFieldFile.invalidType,
            uploadFailed: dict.events.register.customFieldFile.uploadFailed,
            fileInputAriaLabel: dict.events.register.customFieldFile.fileInputAriaLabel,
            imageInputAriaLabel: dict.events.register.customFieldFile.imageInputAriaLabel,
          },
        }}
      />
    </main>
  );
}
