import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBankTransferInstructionsSetting } from "@/lib/billing/loadBankTransferInstructionsSetting";
import { AdminEventCreateForm } from "@/components/dashboard/admin/events/AdminEventCreateForm";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminEventNewPage({ params }: PageProps) {
  await assertAdmin();
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const admin = await createAdminClient();
  const { instructions: globalInstructions } = await loadBankTransferInstructionsSetting(admin);

  const formLabels = dict.admin.events.new;

  return (
    <div>
      <AdminPageHeader
        title={formLabels.title}
        lead={formLabels.lead}
        iconId="events"
        tourAnchor={ADMIN_TOUR_ANCHORS.eventsNewTitle}
      />
      <AdminEventCreateForm
        locale={locale}
        editorLabels={dict.admin.cms.blog.editor}
        academicLabels={dict.dashboard.adminContents}
        fileUploadProgress={dict.common.fileUpload}
        labels={{
          titleLabel: formLabels.titleLabel,
          descriptionLabel: formLabels.descriptionLabel,
          eventDateLabel: formLabels.eventDateLabel,
          locationLabel: formLabels.locationLabel,
          capacityLabel: formLabels.capacityLabel,
          priceLocalLabel: formLabels.priceLocalLabel,
          priceNonLocalLabel: formLabels.priceNonLocalLabel,
          priceHint: formLabels.priceHint,
          currencyLabel: formLabels.currencyLabel,
          currencyGatewayWarning: dict.admin.events.pricing.currencyGatewayWarning,
          bankTransferInstructionsLabel: dict.admin.events.pricing.bankTransferInstructionsLabel,
          bankTransferInstructionsHint: dict.admin.events.pricing.bankTransferInstructionsHint,
          dualTransfer: dict.admin.events.pricing.dualTransfer,
          submit: formLabels.submit,
          back: formLabels.back,
          errorSave: formLabels.errorSave,
          validationError: formLabels.validationError,
        }}
        globalInstructions={globalInstructions}
      />
    </div>
  );
}
