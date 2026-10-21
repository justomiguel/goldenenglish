import { notFound, permanentRedirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadRegistrationMatriculaPayPage } from "@/lib/register/loadRegistrationMatriculaPayPage";
import { buildMatriculaPayPath } from "@/lib/site/publicSharePaths";
import { getBrandForRequest } from "@/lib/brand/server";
import { buildResolvedPublicShareMetadata } from "@/lib/site/buildResolvedPublicShareMetadata";
import { RegistrationMatriculaPayScreen } from "@/components/register/RegistrationMatriculaPayScreen";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; token: string }>;
}) {
  const { locale, token } = await params;
  const [dict, brand, page] = await Promise.all([
    getDictionary(locale),
    getBrandForRequest(),
    loadRegistrationMatriculaPayPage(token),
  ]);
  const section = page?.sectionLabel || dict.register.enrollmentPayUndecidedSection;
  return buildResolvedPublicShareMetadata({
    what: section,
    academyName: brand.name,
    description: dict.socialShare.matriculaDescription,
    path: buildMatriculaPayPath(locale, section, token),
    robots: { index: false, follow: false },
  });
}

export default async function MatriculaPayPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; token: string }>;
}) {
  const { locale, slug, token } = await params;
  const page = await loadRegistrationMatriculaPayPage(token);
  if (!page) notFound();
  const canonical = buildMatriculaPayPath(locale, page.sectionLabel, token);
  if (`/${locale}/matricula/${slug}/${token}` !== canonical) permanentRedirect(canonical);

  const dict = await getDictionary(locale);
  const r = dict.register;
  const studentName = `${page.context.firstName} ${page.context.lastName}`.trim();

  return (
    <RegistrationMatriculaPayScreen
      locale={locale}
      studentName={studentName}
      sectionLabel={page.sectionLabel || r.enrollmentPayUndecidedSection}
      proposedSectionLabel={page.proposedSectionLabel}
      context={page.context}
      sectionIsFull={page.sectionIsFull}
      labels={{
        title: r.enrollmentPayTitle,
        lead: r.enrollmentPayLead,
        full: r.enrollmentPayFull,
        alreadyIn: r.enrollmentPayAlreadyIn,
        amount: r.enrollmentPayAmount,
        enrollmentKind: dict.admin.registrations.intake.enrollmentKind,
        noFee: r.enrollmentPayNoFee,
        needsSection: r.enrollmentPayNeedsSection,
        receiptPending: r.enrollmentPayReceiptPending,
        captured: r.enrollmentPayCaptured,
        capturedFull: r.enrollmentPayCapturedFull,
        noMethods: r.enrollmentPayNoMethods,
        contact: r.enrollmentPayContact,
        whatsapp: r.enrollmentPayWhatsapp,
        noAlternatives: r.enrollmentPayNoAlternatives,
        offerLead: r.enrollmentPayOfferLead,
        offerAccept: r.enrollmentPayOfferAccept,
        offerGone: r.enrollmentPayOfferGone,
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
          acceptOffer: r.enrollmentPayOfferAccept,
        },
      }}
    />
  );
}
