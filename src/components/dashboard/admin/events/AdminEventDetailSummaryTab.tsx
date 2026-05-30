import { AdminEventPublishBar } from "@/components/dashboard/admin/events/AdminEventPublishBar";
import { AdminEventSummaryPricingForm } from "@/components/dashboard/admin/events/AdminEventSummaryPricingForm";
import { AdminEventTranslationsEditor } from "@/components/dashboard/admin/events/AdminEventTranslationsEditor";
import type { EventLocale } from "@/lib/events/domain";
import type { Dictionary } from "@/types/i18n";
import type { loadAdminEventDetailPageModel } from "@/lib/dashboard/events/loadAdminEventDetailPageModel";

type EventDetailModel = Awaited<ReturnType<typeof loadAdminEventDetailPageModel>>;

interface AdminEventDetailSummaryTabProps {
  locale: string;
  eventId: string;
  model: EventDetailModel;
  dict: Dictionary;
}

export function AdminEventDetailSummaryTab({
  locale,
  eventId,
  model,
  dict,
}: AdminEventDetailSummaryTabProps) {
  const { event, defaultLocale, translations } = model;
  const detail = dict.admin.events.detail;
  const i18n = dict.admin.events.i18n;
  const pricing = dict.admin.events.pricing;

  return (
    <div className="space-y-4">
      <AdminEventPublishBar
        locale={locale}
        eventId={eventId}
        status={String(event.status)}
        labels={{
          draftHint: detail.draftHint,
          publish: detail.publish,
          publishSuccess: detail.publishSuccess,
          publishError: detail.publishError,
          unpublish: detail.unpublish,
          unpublishSuccess: detail.unpublishSuccess,
          unpublishError: detail.unpublishError,
          viewPublic: detail.viewPublic,
          publishedHint: detail.publishedHint,
        }}
      />
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {dict.admin.events.kpis.upcoming}: {new Date(String(event.event_date)).toLocaleDateString()} · {dict.admin.events.list.columns.capacity}: {Number(event.capacity)}
        </p>
      </section>
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">{pricing.sectionTitle}</h3>
        <AdminEventSummaryPricingForm
          locale={locale}
          eventId={eventId}
          initial={{
            title: String(event.title),
            description: String(event.description ?? ""),
            eventDate: String(event.event_date),
            location: String(event.location ?? ""),
            capacity: Number(event.capacity),
            priceLocal: event.price_local == null ? null : Number(event.price_local),
            priceNonLocal: event.price_non_local == null ? null : Number(event.price_non_local),
            currency: String(event.currency ?? "CLP"),
            bankTransferInstructions:
              event.bank_transfer_instructions == null
                ? null
                : String(event.bank_transfer_instructions),
          }}
          labels={{
            priceLocalLabel: pricing.priceLocalLabel,
            priceNonLocalLabel: pricing.priceNonLocalLabel,
            priceHint: pricing.priceHint,
            currencyLabel: pricing.currencyLabel,
            bankTransferInstructionsLabel: pricing.bankTransferInstructionsLabel,
            bankTransferInstructionsHint: pricing.bankTransferInstructionsHint,
            save: pricing.save,
            savedOk: pricing.savedOk,
            errorSave: pricing.errorSave,
          }}
        />
      </section>
      <AdminEventTranslationsEditor
        adminLocale={locale}
        eventId={eventId}
        defaultLocale={defaultLocale as EventLocale}
        initialTranslations={translations}
        editorLabels={dict.admin.cms.blog.editor}
        academicLabels={dict.dashboard.adminContents}
        labels={{
          sectionTitle: i18n.sectionTitle,
          localeTabsAria: i18n.localeTabsAria,
          localeTab: i18n.localeTab,
          titleLabel: i18n.titleLabel,
          descriptionLabel: i18n.descriptionLabel,
          locationLabel: i18n.locationLabel,
          save: i18n.save,
          translate: i18n.translate,
          translateDisabled: i18n.translateDisabled,
          savedOk: i18n.savedOk,
          errorSave: i18n.errorSave,
          errorTranslate: i18n.errorTranslate,
          googleKeyMissing: i18n.googleKeyMissing,
        }}
      />
    </div>
  );
}
