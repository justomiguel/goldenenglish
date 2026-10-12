import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadEventForPublicLanding } from "@/lib/dashboard/events/loadEventForPublicLanding";
import { loadEventRegistrationPaymentMethods } from "@/lib/events/server/loadEventRegistrationPaymentMethods";
import { loadBankTransferInstructionsSetting } from "@/lib/billing/loadBankTransferInstructionsSetting";
import { resolveBankTransferInstructions } from "@/lib/billing/resolveBankTransferInstructions";
import { fillEventTransferReceiptMaxMbTemplate } from "@/lib/events/eventTransferReceiptLimits";
import { EventRegisterForm } from "@/components/organisms/EventRegisterForm";
import { loadPublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventRegisterPageClasses } from "@/lib/events/publicEventSurfaceClasses";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; eventId: string }>;
}

export default async function EventRegistrationFormPreviewPage({ params }: PageProps) {
  const { locale, eventId } = await params;
  let supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"];
  try {
    ({ supabase } = await assertAdmin());
  } catch (err) {
    const message = (err as Error)?.message;
    if (message === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (message === ADMIN_SESSION_FORBIDDEN) notFound();
    throw err;
  }

  const dict = await getDictionary(locale);
  const [event, surfaceVariant] = await Promise.all([
    loadEventForPublicLanding(supabase, "", locale, { eventId, includeUnpublished: true }),
    loadPublicEventSurfaceVariant(),
  ]);
  if (!event) notFound();

  const paymentMethods = await loadEventRegistrationPaymentMethods(event.currency);
  const { instructions: globalBankTransferInstructions } =
    await loadBankTransferInstructionsSetting(supabase);
  const register = dict.events.register;
  const formLabels = dict.admin.events.form;
  const pageClasses = publicEventRegisterPageClasses(surfaceVariant);

  return (
    <main className="space-y-6">
      <Link href={`/${locale}/dashboard/admin/events/${eventId}?tab=form`} className={pageClasses.backLink}>
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {formLabels.previewBack}
      </Link>
      <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-foreground)]">
        {formLabels.previewBanner}
      </p>
      <div className="space-y-3">
        <h1 className={pageClasses.title}>{register.title}</h1>
        <p className={pageClasses.lead}>{register.lead}</p>
      </div>
      <EventRegisterForm
        preview
        locale={locale}
        event={{
          ...event,
          bankTransferInstructions: resolveBankTransferInstructions(
            event.bankTransferInstructions,
            globalBankTransferInstructions,
          ),
        }}
        paymentMethods={paymentMethods}
        surfaceVariant={surfaceVariant}
        labels={{
          participantSection: register.participantSection,
          flowQuestion: register.flowQuestion,
          firstName: register.firstName,
          lastName: register.lastName,
          dni: register.dni,
          email: register.email,
          phone: register.phone,
          birthDate: register.birthDate,
          submit: register.submit,
          consent: register.consent,
          error: register.error,
          successModal: register.successModal,
          captchaRequired: register.captchaRequired,
          tutor: register.tutor,
          payment: register.payment,
          residency: register.residency,
          transferReceipt: {
            ...register.transferReceipt,
            hint: fillEventTransferReceiptMaxMbTemplate(register.transferReceipt.hint),
            tooLarge: fillEventTransferReceiptMaxMbTemplate(register.transferReceipt.tooLarge),
          },
          transferInstructions: register.transferInstructions,
          selectPlaceholder: register.selectPlaceholder,
          fileUploadProgressSending: dict.common.fileUpload.progressSending,
          customFieldFile: register.customFieldFile,
        }}
      />
    </main>
  );
}
