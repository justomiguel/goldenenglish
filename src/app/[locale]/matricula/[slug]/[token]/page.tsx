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
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string; token: string }>;
  searchParams: Promise<{ result?: string | string[] }>;
}) {
  const { locale, slug, token } = await params;
  const query = await searchParams;
  const rawResult = query.result;
  const result = (Array.isArray(rawResult) ? rawResult[0] : rawResult)?.trim() ?? "";
  const dict = await getDictionary(locale);
  const page = await loadRegistrationMatriculaPayPage(token);
  if (!page) notFound();
  const sectionLabel = page.sectionLabel || dict.register.enrollmentPayUndecidedSection;
  const canonical = buildMatriculaPayPath(locale, sectionLabel, token);
  if (`/${locale}/matricula/${slug}/${token}` !== canonical) {
    const dest = result ? `${canonical}?result=${encodeURIComponent(result)}` : canonical;
    permanentRedirect(dest);
  }

  const r = dict.register;
  const studentName = `${page.context.firstName} ${page.context.lastName}`.trim();

  return (
    <RegistrationMatriculaPayScreen
      locale={locale}
      studentName={studentName}
      sectionLabel={sectionLabel}
      proposedSectionLabel={page.proposedSectionLabel}
      context={page.context}
      sectionIsFull={page.sectionIsFull}
      result={result}
      homeHref={`/${locale}`}
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
        leaving: r.enrollmentPayLeaving,
        gatewayRejected: r.enrollmentPayGatewayRejected,
        gatewayPending: r.enrollmentPayGatewayPending,
        cashOk: r.enrollmentPayCashOk,
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
          chooseFile: r.enrollmentPayChooseFile,
          pickSection: r.enrollmentPayPickSection,
          error: r.enrollmentPayError,
          failures: r.payFailure,
          receiptOk: r.enrollmentPayReceiptOk,
          acceptOffer: r.enrollmentPayOfferAccept,
          cash: r.enrollmentPayCash,
          online: r.enrollmentPayOnline,
          uploadChoice: r.enrollmentPayUploadChoice,
          onlineEmpty: r.enrollmentPayOnlineEmpty,
          cashOk: r.enrollmentPayCashOk,
        },
      }}
    />
  );
}
