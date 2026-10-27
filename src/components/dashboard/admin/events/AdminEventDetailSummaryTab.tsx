import { CalendarClock, CreditCard, Globe } from "lucide-react";
import { AdminEventDuplicateButton } from "@/components/dashboard/admin/events/AdminEventDuplicateButton";
import { AdminEventSummarySection } from "@/components/dashboard/admin/events/AdminEventSummarySection";
import { AdminEventPublishBar } from "@/components/dashboard/admin/events/AdminEventPublishBar";
import { AdminEventShowOnHomeToggle } from "@/components/dashboard/admin/events/AdminEventShowOnHomeToggle";
import { AdminEventSummaryScheduleForm } from "@/components/dashboard/admin/events/AdminEventSummaryScheduleForm";
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
  const schedule = dict.admin.events.schedule;
  const formLabels = dict.admin.events.new;

  return (
    <div className="space-y-3">
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 shadow-[var(--shadow-soft)]">
        <AdminEventShowOnHomeToggle
          locale={locale}
          eventId={eventId}
          showOnHome={Boolean(event.show_on_home)}
          labels={detail.showOnHome}
        />
        <AdminEventDuplicateButton locale={locale} eventId={eventId} labels={detail.duplicate} />
      </div>

      <AdminEventSummarySection
        icon={CalendarClock}
        step="1"
        title={schedule.sectionTitle}
        lead={schedule.sectionLead}
        defaultOpen
      >
          <AdminEventSummaryScheduleForm
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
              eventDateLabel: formLabels.eventDateLabel,
              locationLabel: formLabels.locationLabel,
              capacityLabel: formLabels.capacityLabel,
              save: schedule.save,
              savedOk: schedule.savedOk,
              errorSave: schedule.errorSave,
              validationError: formLabels.validationError,
            }}
          />
      </AdminEventSummarySection>

      <AdminEventSummarySection
        icon={CreditCard}
        step="2"
        title={pricing.sectionTitle}
        lead={pricing.sectionLead}
        defaultOpen
      >
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
              bankTransferSourcesConfig: event.bank_transfer_sources_config ?? null,
              globalInstructions: model.globalBankTransferInstructions,
              allowFamilyDiscount: Boolean(event.allow_family_discount),
              allowMinorTickets: Boolean(event.allow_minor_tickets),
              minorTicketPrice:
                event.minor_ticket_price == null ? null : Number(event.minor_ticket_price),
              allowMultipleTickets: Boolean(event.allow_multiple_tickets),
              maxTicketsPerRegistration:
                event.max_tickets_per_registration == null
                  ? null
                  : Number(event.max_tickets_per_registration),
              companionRequireDetails: Boolean(event.companion_require_details),
              companionCollectDni: Boolean(event.companion_collect_dni),
              companionCollectEmail: Boolean(event.companion_collect_email),
              companionCollectBirthDate: Boolean(event.companion_collect_birth_date),
            }}
            labels={{
              priceLocalLabel: pricing.priceLocalLabel,
              priceNonLocalLabel: pricing.priceNonLocalLabel,
              priceHint: pricing.priceHint,
              allowFamilyDiscountLabel: pricing.allowFamilyDiscountLabel,
              allowMinorTicketsLabel: pricing.allowMinorTicketsLabel,
              minorTicketPriceLabel: pricing.minorTicketPriceLabel,
              minorTicketPriceHint: pricing.minorTicketPriceHint,
              currencyLabel: pricing.currencyLabel,
              currencyGatewayWarning: pricing.currencyGatewayWarning,
              bankTransferInstructionsLabel: pricing.bankTransferInstructionsLabel,
              bankTransferInstructionsHint: pricing.bankTransferInstructionsHint,
              groupPriceTitle: pricing.groupPriceTitle,
              groupPriceLead: pricing.groupPriceLead,
              groupTicketsTitle: pricing.groupTicketsTitle,
              groupTicketsLead: pricing.groupTicketsLead,
              groupTransferTitle: pricing.groupTransferTitle,
              groupTransferLead: pricing.groupTransferLead,
              multiTicket: pricing.multiTicket,
              dualTransfer: pricing.dualTransfer,
              save: pricing.save,
              savedOk: pricing.savedOk,
              errorSave: pricing.errorSave,
            }}
          />
      </AdminEventSummarySection>

      <AdminEventSummarySection
        icon={Globe}
        step="3"
        title={i18n.sectionTitle}
        lead={i18n.sectionLead}
      >
          <AdminEventTranslationsEditor
            embedded
            adminLocale={locale}
            eventId={eventId}
            defaultLocale={defaultLocale as EventLocale}
            initialTranslations={translations}
            editorLabels={dict.admin.cms.blog.editor}
            academicLabels={dict.dashboard.adminContents}
            fileUploadProgress={dict.common.fileUpload}
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
      </AdminEventSummarySection>
    </div>
  );
}
