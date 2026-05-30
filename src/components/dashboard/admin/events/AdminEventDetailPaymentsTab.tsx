import { AdminEventPaymentsPanel } from "@/components/dashboard/admin/events/AdminEventPaymentsPanel";
import type { Dictionary } from "@/types/i18n";
import type { loadAdminEventDetailPageModel } from "@/lib/dashboard/events/loadAdminEventDetailPageModel";

type EventDetailModel = Awaited<ReturnType<typeof loadAdminEventDetailPageModel>>;

interface AdminEventDetailPaymentsTabProps {
  locale: string;
  eventId: string;
  model: EventDetailModel;
  dict: Dictionary;
}

export function AdminEventDetailPaymentsTab({
  locale,
  eventId,
  model,
  dict,
}: AdminEventDetailPaymentsTabProps) {
  const detail = dict.admin.events.detail;

  return (
    <AdminEventPaymentsPanel
      locale={locale}
      eventId={eventId}
      payments={model.eventPayments}
      searchQuery={model.paymentsQuery}
      statusFilter={model.paymentStatusFilter}
      labels={{
        title: dict.admin.finance.events.title,
        lead: detail.paymentsLead,
        empty: detail.paymentsEmpty,
        searchPlaceholder: detail.paymentsSearchPlaceholder,
        searchButton: detail.paymentsSearchButton,
        filterAll: detail.paymentsFilterAll,
        filterPending: dict.admin.finance.events.pendingLabel,
        filterApproved: dict.admin.finance.events.approvedLabel,
        filterRejected: dict.admin.finance.events.rejectedLabel,
        summaryPending: detail.paymentsSummaryPending,
        summaryApproved: detail.paymentsSummaryApproved,
        summaryRejected: detail.paymentsSummaryRejected,
        row: {
          amount: dict.admin.payments.amount,
          dni: detail.attendeesColumns.dni,
          email: detail.attendeesColumns.email,
          phone: detail.attendeesColumns.phone,
          method: detail.paymentsMethodLabel,
          registered: detail.attendeesColumns.registered,
          receipt: dict.admin.payments.receipt,
          noReceipt: detail.paymentsNoReceipt,
          noPhone: detail.attendeesNoPhone,
          notes: dict.admin.payments.notes,
          notesTooltip: dict.admin.payments.notesTooltip,
          approve: dict.admin.payments.approve,
          reject: dict.admin.payments.reject,
          approveTooltip: dict.admin.payments.approveTooltip,
          rejectTooltip: dict.admin.payments.rejectTooltip,
          delete: detail.paymentsDelete,
          deleteTooltip: detail.paymentsDeleteTooltip,
          deleteConfirmTitle: detail.paymentsDeleteConfirmTitle,
          deleteConfirmBody: detail.paymentsDeleteConfirmBody,
          deleteConfirm: detail.paymentsDeleteConfirm,
          cancel: detail.paymentsDeleteCancel,
          errorDelete: detail.paymentsErrorDelete,
          receiptOpenTooltip: dict.admin.payments.receiptOpenTooltip,
          reviewNotes: detail.paymentsReviewNotesLabel,
          paidAt: detail.paymentsPaidAtLabel,
          errorSave: detail.paymentsErrorSave,
          statusLabels: {
            pending: dict.admin.finance.events.pendingLabel,
            approved: dict.admin.finance.events.approvedLabel,
            rejected: dict.admin.finance.events.rejectedLabel,
          },
          methodLabels: detail.paymentsMethodLabels,
        },
        pagination: {
          prev: dict.admin.table.paginationPrev,
          next: dict.admin.table.paginationNext,
          summary: dict.admin.table.paginationSummary,
        },
      }}
    />
  );
}
