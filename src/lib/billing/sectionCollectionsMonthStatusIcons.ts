import {
  CalendarOff,
  Check,
  CircleDot,
  Clock,
  FileText,
  MinusCircle,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

/**
 * Icons for Finance collections + admin billing matrices.
 * `no-plan` vs `out-of-period` use distinct glyphs so staff can tell “no fee rule” from “outside billing window”.
 */
export const SECTION_COLLECTIONS_MONTH_STATUS_ICONS: Record<
  StudentMonthlyPaymentCell["status"],
  LucideIcon
> = {
  approved: Check,
  pending: Clock,
  rejected: X,
  exempt: FileText,
  due: CircleDot,
  "no-plan": MinusCircle,
  "out-of-period": CalendarOff,
};
