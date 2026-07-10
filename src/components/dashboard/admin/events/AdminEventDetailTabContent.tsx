import { AdminEventAttendeesPanel } from "@/components/dashboard/admin/events/AdminEventAttendeesPanel";
import { EventFormFieldsEditor } from "@/components/dashboard/admin/events/EventFormFieldsEditor";
import { AdminEventDetailSummaryTab } from "@/components/dashboard/admin/events/AdminEventDetailSummaryTab";
import { AdminEventDetailPaymentsTab } from "@/components/dashboard/admin/events/AdminEventDetailPaymentsTab";
import type { EventAdminTab } from "@/components/dashboard/admin/events/AdminEventDetailTabs";
import type { EventLocale } from "@/lib/events/domain";
import type { Dictionary } from "@/types/i18n";
import type { loadAdminEventDetailPageModel } from "@/lib/dashboard/events/loadAdminEventDetailPageModel";
import { pickEventFieldLabel } from "@/lib/events/pickEventFieldLabel";

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
        nextFieldPosition={model.nextFieldPosition}
        labels={{
          pageLead: formLabels.lead,
          collectBirthDate: formLabels.collectBirthDate,
          customFieldsTitle: formLabels.customFieldsTitle,
          customFieldsEmpty: formLabels.customFieldsEmpty,
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

  if (tab === "waitlist" || tab === "notifications") {
    return (
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted-foreground)]">
        {tab === "waitlist" ? detail.waitlistLead : detail.notificationsLead}
      </section>
    );
  }

  return null;
}
