import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { AdminEventCreateForm } from "@/components/dashboard/admin/events/AdminEventCreateForm";

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

  const formLabels = dict.admin.events.new;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {formLabels.title}
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        {formLabels.lead}
      </p>
      <AdminEventCreateForm
        locale={locale}
        editorLabels={dict.admin.cms.blog.editor}
        academicLabels={dict.dashboard.adminContents}
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
          bankTransferInstructionsLabel: dict.admin.events.pricing.bankTransferInstructionsLabel,
          bankTransferInstructionsHint: dict.admin.events.pricing.bankTransferInstructionsHint,
          submit: formLabels.submit,
          back: formLabels.back,
          errorSave: formLabels.errorSave,
          validationError: formLabels.validationError,
        }}
      />
    </div>
  );
}
