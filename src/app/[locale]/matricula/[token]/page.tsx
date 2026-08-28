import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadRegistrationMatriculaPayPage } from "@/lib/register/loadRegistrationMatriculaPayPage";
import { RegistrationMatriculaPayScreen } from "@/components/register/RegistrationMatriculaPayScreen";

export const dynamic = "force-dynamic";

export default async function MatriculaPayPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const page = await loadRegistrationMatriculaPayPage(token);
  if (!page) notFound();

  const dict = await getDictionary(locale);
  const r = dict.register;
  const studentName = `${page.context.firstName} ${page.context.lastName}`.trim();

  return (
    <RegistrationMatriculaPayScreen
      locale={locale}
      studentName={studentName}
      sectionLabel={page.sectionLabel || r.enrollmentPayUndecidedSection}
      context={page.context}
      sectionIsFull={page.sectionIsFull}
      labels={{
        title: r.enrollmentPayTitle,
        lead: r.enrollmentPayLead,
        full: r.enrollmentPayFull,
        alreadyIn: r.enrollmentPayAlreadyIn,
        amount: r.enrollmentPayAmount,
        noFee: r.enrollmentPayNoFee,
        needsSection: r.enrollmentPayNeedsSection,
        receiptPending: r.enrollmentPayReceiptPending,
        captured: r.enrollmentPayCaptured,
        capturedFull: r.enrollmentPayCapturedFull,
        noMethods: r.enrollmentPayNoMethods,
        contact: r.enrollmentPayContact,
        whatsapp: r.enrollmentPayWhatsapp,
        noAlternatives: r.enrollmentPayNoAlternatives,
      }}
      payUi={{
        token,
        methods: page.methods,
        transferInstructions: page.transferInstructions,
        alternatives: page.alternatives,
        whatsappUrl: page.whatsappUrl,
        contactEmail: page.contactEmail,
        actionLabels: {
          flow: r.enrollmentPayFlow,
          mercadoPago: r.enrollmentPayMercadoPago,
          transfer: r.enrollmentPayTransfer,
          transferHint: r.enrollmentPayTransferHint,
          uploadButton: r.enrollmentPayUploadButton,
          pickSection: r.enrollmentPayPickSection,
          error: r.enrollmentPayError,
          receiptOk: r.enrollmentPayReceiptOk,
        },
      }}
    />
  );
}
