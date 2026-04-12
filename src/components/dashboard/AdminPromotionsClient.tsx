"use client";

import { AdminPromotionsForm } from "@/components/dashboard/AdminPromotionsForm";
import {
  AdminPromotionsTable,
  type AdminPromotionRow,
} from "@/components/dashboard/AdminPromotionsTable";
import type { Dictionary } from "@/types/i18n";

interface AdminPromotionsClientProps {
  locale: string;
  initialRows: AdminPromotionRow[];
  labels: Dictionary["admin"]["promotions"];
}

export function AdminPromotionsClient({ locale, initialRows, labels }: AdminPromotionsClientProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{labels.title}</h1>
        <p className="mt-2 text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </div>
      <AdminPromotionsForm locale={locale} labels={labels} />
      <AdminPromotionsTable locale={locale} rows={initialRows} labels={labels} />
    </div>
  );
}
