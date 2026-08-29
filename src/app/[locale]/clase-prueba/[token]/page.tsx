import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadRegistrationTrialFeePayPage } from "@/lib/register/loadRegistrationTrialFeePayPage";
import { RegistrationMatriculaPayScreen } from "@/components/register/RegistrationMatriculaPayScreen";

export const dynamic = "force-dynamic";

export default async function TrialFeePayPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const page = await loadRegistrationTrialFeePayPage(token);
  if (!page) notFound();

  const dict = await getDictionary(locale);
  const r = dict.register;
  const studentName = `${page.context.firstName} ${page.context.lastName}`.trim();

  return (
    <RegistrationMatriculaPayScreen
      locale={locale}
      studentName={studentName}
      sectionLabel={page.sectionLabel || r.trial.payUndecidedSection}
      context={page.context}
      sectionIsFull={page.sectionIsFull}
      labels={{
        title: r.trial.payTitle,
        lead: r.trial.payLead,
        full: r.trial.payFull,
        alreadyIn: r.trial.payAlreadyIn,
        amount: r.trial.payAmount,
        noFee: r.trial.noFeeNote,
        needsSection: r.trial.needsSection,
        receiptPending: r.trial.payReceiptPending,
        captured: r.trial.payCaptured,
        capturedFull: r.trial.payCapturedFull,
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
          error: r.trial.payError,
          receiptOk: r.enrollmentPayReceiptOk,
        },
        variant: "trial",
      }}
    />
  );
}
