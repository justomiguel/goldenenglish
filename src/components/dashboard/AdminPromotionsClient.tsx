"use client";

import { AdminPromotionsForm } from "@/components/dashboard/AdminPromotionsForm";
import {
  AdminPromotionsTable,
  type AdminPromotionRow,
} from "@/components/dashboard/AdminPromotionsTable";
import type { Dictionary } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

interface AdminPromotionsClientProps {
  locale: string;
  initialRows: AdminPromotionRow[];
  labels: Dictionary["admin"]["promotions"];
}

export function AdminPromotionsClient({ locale, initialRows, labels }: AdminPromotionsClientProps) {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={labels.title}
        lead={labels.lead}
        iconId="promotions"
        tourAnchor={ADMIN_TOUR_ANCHORS.promotionsTitle}
      />
      <div data-tour={ADMIN_TOUR_ANCHORS.promotionsCreateForm}>
        <AdminPromotionsForm locale={locale} labels={labels} />
      </div>
      <div data-tour={ADMIN_TOUR_ANCHORS.promotionsTable}>
        <AdminPromotionsTable locale={locale} rows={initialRows} labels={labels} />
      </div>
    </div>
  );
}
