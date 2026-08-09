/**
 * Cobro por clases: catálogo de precios no lineal + bolsa mensual del alumno.
 *
 * El catálogo es a nivel instituto (no por sección) porque la bolsa es del alumno y cruza secciones.
 * `amount` es el precio TOTAL del paquete de `classCount` clases, no unitario: la no linealidad se
 * expresa como tabla, sin fórmula ni interpolación entre tramos.
 */

export type ClassPackStatus = "pending" | "approved" | "rejected" | "exempt";

/** Solo estos estados otorgan créditos: un paquete pendiente de revisión no puede volverse clases gratis. */
export const CLASS_PACK_GRANTING_STATUSES: readonly ClassPackStatus[] = ["approved", "exempt"];

export type ClassPackGatewayProvider = "flow" | "mercadopago";

export interface ClassPackPrice {
  id: string;
  effectiveFromYear: number;
  effectiveFromMonth: number;
  classCount: number;
  amount: number;
  /** ISO 4217 (3 letras mayúsculas), p.ej. "USD", "ARS", "CLP". */
  currency: string;
  archivedAt: string | null;
}

export interface StudentClassPack {
  id: string;
  studentId: string;
  year: number;
  month: number;
  /** Clases contratadas. Snapshot al momento de comprar. */
  classCount: number;
  /** Precio pagado, congelado al momento de comprar. */
  amount: number;
  currency: string;
  /** Tramo del catálogo que coteó la compra. Solo trazabilidad. */
  priceId: string | null;
  status: ClassPackStatus;
  /** Storage path del comprobante. Nombre honesto, a diferencia de `payments.receipt_url`. */
  receiptStoragePath: string | null;
  gatewayProvider: ClassPackGatewayProvider | null;
  paidAt: string | null;
  createdAt: string | null;
}

export interface ClassPackPriceRowDb {
  id: string;
  effective_from_year: number;
  effective_from_month: number;
  class_count: number;
  amount: string | number;
  currency: string;
  archived_at?: string | null;
}

export interface StudentClassPackRowDb {
  id: string;
  student_id: string;
  year: number;
  month: number;
  class_count: number;
  amount: string | number;
  currency: string;
  price_id?: string | null;
  status: string;
  receipt_storage_path?: string | null;
  gateway_provider?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
}

export const DEFAULT_CLASS_PACK_CURRENCY = "USD" as const;

const ISO_4217_RE = /^[A-Z]{3}$/;

export function normalizeClassPackCurrency(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_CLASS_PACK_CURRENCY;
  const upper = raw.trim().toUpperCase();
  return ISO_4217_RE.test(upper) ? upper : DEFAULT_CLASS_PACK_CURRENCY;
}

function toNumber(raw: string | number): number {
  return typeof raw === "string" ? Number(raw) : raw;
}

export function parseClassPackStatus(raw: unknown): ClassPackStatus | null {
  if (raw === "pending" || raw === "approved" || raw === "rejected" || raw === "exempt") return raw;
  return null;
}

function parseGatewayProvider(raw: unknown): ClassPackGatewayProvider | null {
  return raw === "flow" || raw === "mercadopago" ? raw : null;
}

export function mapClassPackPriceRow(row: ClassPackPriceRowDb): ClassPackPrice {
  return {
    id: row.id,
    effectiveFromYear: Number(row.effective_from_year),
    effectiveFromMonth: Number(row.effective_from_month),
    classCount: Number(row.class_count),
    amount: toNumber(row.amount),
    currency: normalizeClassPackCurrency(row.currency),
    archivedAt: row.archived_at ?? null,
  };
}

export function mapStudentClassPackRow(row: StudentClassPackRowDb): StudentClassPack {
  return {
    id: row.id,
    studentId: row.student_id,
    year: Number(row.year),
    month: Number(row.month),
    classCount: Number(row.class_count),
    amount: toNumber(row.amount),
    currency: normalizeClassPackCurrency(row.currency),
    priceId: row.price_id ?? null,
    // Un estado desconocido se trata como 'rejected': no otorga créditos.
    status: parseClassPackStatus(row.status) ?? "rejected",
    receiptStoragePath: row.receipt_storage_path ?? null,
    gatewayProvider: parseGatewayProvider(row.gateway_provider),
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at ?? null,
  };
}
