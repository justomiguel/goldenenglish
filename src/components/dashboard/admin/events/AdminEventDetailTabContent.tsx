import { AdminEventAttendeesPanel } from "@/components/dashboard/admin/events/AdminEventAttendeesPanel";
import { AdminEventNotificationsPanel } from "@/components/dashboard/admin/events/AdminEventNotificationsPanel";
import { EventFormFieldsEditor } from "@/components/dashboard/admin/events/EventFormFieldsEditor";
import { AdminEventDetailSummaryTab } from "@/components/dashboard/admin/events/AdminEventDetailSummaryTab";
import { AdminEventDetailPaymentsTab } from "@/components/dashboard/admin/events/AdminEventDetailPaymentsTab";
import type { EventAdminTab } from "@/components/dashboard/admin/events/AdminEventDetailTabs";
import type { EventLocale } from "@/lib/events/domain";
import type { Dictionary } from "@/types/i18n";
import type { loadAdminEventDetailPageModel } from "@/lib/dashboard/events/loadAdminEventDetailPageModel";
import { pickEventFieldLabel } from "@/lib/events/pickEventFieldLabel";
import { registrationFlowName } from "@/lib/events/server/loadActiveRegistrationFlows";

type EventDetailModel = Awaited<ReturnType<typeof loadAdminEventDetailPageModel>>;

interface AdminEventDetailTabContentProps {
  tab: EventAdminTab;
  locale: string;
  eventId: string;
  model: EventDetailModel;
  dict: Dictionary;
}

export function AdminEventDetailTabContent({
  tab,
  locale,
  eventId,
  model,
  dict,
}: AdminEventDetailTabContentProps) {
  const detail = dict.admin.events.detail;
  const formLabels = dict.admin.events.form;

  if (tab === "summary") {
    return <AdminEventDetailSummaryTab locale={locale} eventId={eventId} model={model} dict={dict} />;
  }

  if (tab === "form") {
    return (
      <EventFormFieldsEditor
        eventId={eventId}
        fields={model.mappedFields}
        locale={locale}
        defaultLocale={model.defaultLocale as EventLocale}
        showBirthDateField={model.showBirthDateField}
        showResidencyField={model.showResidencyField}
        showPaymentField={model.showPaymentField}
        collectBirthDate={model.collectBirthDate}
        registrationFieldOrder={model.registrationFieldOrder}
        requirePhone={model.requirePhone}
        requireBirthDate={model.requireBirthDate}
        priceByFlow={model.priceByFlow}
        registrationFlows={model.registrationFlows.map((flow) => ({
          id: flow.id,
          name: registrationFlowName(flow.nameI18n, locale, model.defaultLocale),
          price: flow.price,
          fieldOrder: flow.fieldOrder,
        }))}
        nextFieldPosition={model.nextFieldPosition}
        eventPublished={String(model.event.status) === "published"}
        labels={{
          pageLead: formLabels.lead,
          previewButton: formLabels.previewButton,
          previewBanner: formLabels.previewBanner,
          previewBack: formLabels.previewBack,
          deleteField: formLabels.deleteField,
          collectBirthDate: formLabels.collectBirthDate,
          customFieldsTitle: formLabels.customFieldsTitle,
          customFieldsEmpty: formLabels.customFieldsEmpty,
          questionOrderTitle: formLabels.questionOrderTitle,
          questionOrderLead: formLabels.questionOrderLead,
          dragHandle: formLabels.dragHandle,
          moveUp: formLabels.moveUp,
          moveDown: formLabels.moveDown,
          errorOrderSave: formLabels.errorOrderSave,
          errorRequirementsSave: formLabels.errorRequirementsSave,
          flows: formLabels.flows,
          archive: detail.archive,
          edit: formLabels.editButton,
          baseFields: {
            title: formLabels.baseFieldsTitle,
            lead: formLabels.baseFieldsLead,
            requiredBadge: formLabels.requiredBadge,
            optionalBadge: formLabels.optionalBadge,
            conditionalBadge: formLabels.conditionalBadge,
            baseFields: formLabels.baseFields,
            baseFieldNotes: formLabels.baseFieldNotes,
          },
          addField: {
            title: formLabels.addFieldTitle,
            fieldKeyLabel: formLabels.fieldKeyLabel,
            fieldKeyHint: formLabels.fieldKeyHint,
            fieldTypeLabel: formLabels.fieldTypeLabel,
            fieldLabelLabel: formLabels.fieldLabelLabel,
            requiredLabel: formLabels.requiredLabel,
            addButton: formLabels.addButton,
            errorSave: formLabels.errorSave,
            errorValidation: formLabels.errorValidation,
            errorDuplicateKey: formLabels.errorDuplicateKey,
            errorSelectOptions: formLabels.errorSelectOptions,
            fieldTypes: formLabels.fieldTypes,
            previewTitle: formLabels.previewTitle,
            previewPlaceholder: formLabels.previewPlaceholder,
            selectOptions: formLabels.selectOptions,
            fileTypesLabel: formLabels.fileTypesLabel,
            fileTypesHint: formLabels.fileTypesHint,
          },
          editField: {
            title: formLabels.editFieldTitle,
            fieldKeyLabel: formLabels.fieldKeyLabel,
            fieldKeyReadOnlyHint: formLabels.fieldKeyReadOnlyHint,
            fieldTypeLabel: formLabels.fieldTypeLabel,
            fieldLabelLabel: formLabels.fieldLabelLabel,
            requiredLabel: formLabels.requiredLabel,
            saveButton: formLabels.saveButton,
            cancelButton: formLabels.cancelEditButton,
            errorSave: formLabels.errorSave,
            errorValidation: formLabels.errorValidation,
            errorSelectOptions: formLabels.errorSelectOptions,
            fieldTypes: formLabels.fieldTypes,
            previewTitle: formLabels.previewTitle,
            previewPlaceholder: formLabels.previewPlaceholder,
            selectOptions: formLabels.selectOptions,
            fileTypesLabel: formLabels.fileTypesLabel,
            fileTypesHint: formLabels.fileTypesHint,
          },
          selectOptionsCount: formLabels.selectOptionsCount,
        }}
      />
    );
  }

  if (tab === "attendees") {
    const customFieldColumns = model.mappedFields.map((field) => ({
      fieldKey: field.fieldKey,
      label: pickEventFieldLabel(field.labelI18n, locale, model.defaultLocale) || field.fieldKey,
    }));

    return (
      <AdminEventAttendeesPanel
        locale={locale}
        eventId={eventId}
        rows={model.attendees.rows}
        customFieldValues={model.attendeeCustomFields}
        customFieldColumns={customFieldColumns}
        totalCount={model.attendees.totalCount}
        page={model.attendees.page}
        pageSize={model.attendees.pageSize}
        searchQuery={model.attendeesQuery}
        labels={{
          title: detail.attendeesTitle,
          empty: detail.attendeesEmpty,
          searchPlaceholder: detail.attendeesSearchPlaceholder,
          searchButton: detail.attendeesSearchButton,
          expandRow: detail.attendeesExpandRow,
          collapseRow: detail.attendeesCollapseRow,
          moreDetails: detail.attendeesMoreDetails,
          columns: detail.attendeesColumns,
          statusLabels: detail.attendeesStatusLabels,
          paymentLabels: {
            pending: dict.admin.finance.events.pendingLabel,
            approved: dict.admin.finance.events.approvedLabel,
            rejected: dict.admin.finance.events.rejectedLabel,
          },
          residencyLabels: detail.attendeesResidencyLabels,
          sourceLabels: detail.attendeesSourceLabels,
          tutorSectionTitle: detail.attendeesTutorSectionTitle,
          customFieldsTitle: detail.attendeesCustomFieldsTitle,
          openCustomFile: detail.attendeesOpenCustomFile,
          customFieldImageAlt: detail.attendeesCustomFieldImageAlt,
          noPhone: detail.attendeesNoPhone,
          noBirthDate: detail.attendeesNoBirthDate,
          noPayment: detail.attendeesNoPayment,
          pagination: {
            prev: dict.admin.table.paginationPrev,
            next: dict.admin.table.paginationNext,
            summary: dict.admin.table.paginationSummary,
            pageOf: detail.attendeesPaginationPageOf,
            navAria: detail.attendeesPaginationNav,
          },
          export: {
            downloadXlsx: detail.attendeesExport.downloadXlsx,
            downloadPdf: detail.attendeesExport.downloadPdf,
            tipXlsx: detail.attendeesExport.tipXlsx,
            tipPdf: detail.attendeesExport.tipPdf,
            exportError: detail.attendeesExport.exportError,
          },
          delete: {
            delete: detail.attendeesDelete,
            deleteTooltip: detail.attendeesDeleteTooltip,
            deleteConfirmTitle: detail.attendeesDeleteConfirmTitle,
            deleteConfirmBody: detail.attendeesDeleteConfirmBody,
            deleteConfirm: detail.attendeesDeleteConfirm,
            cancel: detail.attendeesDeleteCancel,
            errorDelete: detail.attendeesErrorDelete,
            errorNotDeletable: detail.attendeesErrorNotDeletable,
          },
        }}
      />
    );
  }

  if (tab === "payments") {
    return <AdminEventDetailPaymentsTab locale={locale} eventId={eventId} model={model} dict={dict} />;
  }

  if (tab === "waitlist") {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-sm text-[var(--color-muted-foreground)] shadow-[var(--shadow-soft)]">
        {detail.waitlistLead}
      </section>
    );
  }

  if (tab === "notifications") {
    return (
      <AdminEventNotificationsPanel
        eventId={eventId}
        pageLocale={locale}
        flows={model.registrationFlows.map((flow) => ({
          id: flow.id,
          name: registrationFlowName(flow.nameI18n, locale, model.defaultLocale),
        }))}
        lead={detail.notificationsLead}
        labels={detail.emailTemplates}
        bodyField={dict.admin.communications.templates.bodyField}
      />
    );
  }

  return null;
}
