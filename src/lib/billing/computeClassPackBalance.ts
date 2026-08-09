import { CLASS_PACK_GRANTING_STATUSES, type StudentClassPack } from "@/types/classPack";
import type { ClassCreditConsumption } from "@/types/classCreditLedger";

export interface ClassPackBalanceArgs {
  year: number;
  month: number;
  packs: readonly StudentClassPack[];
  consumptions: readonly ClassCreditConsumption[];
}

export interface ClassPackBalance {
  /** Clases otorgadas por los paquetes del mes que ya están pagos o exentos. */
  granted: number;
  /** Clases consumidas por asistencia en el mes. */
  consumed: number;
  /** `granted - consumed`. Puede ser negativo: es deuda de clases. */
  balance: number;
}

function inPeriod(row: { year: number; month: number }, year: number, month: number): boolean {
  return row.year === year && row.month === month;
}

/**
 * Saldo de clases del mes. **Derivado, nunca almacenado**: la asistencia se corrige y se borra, así
 * que un saldo persistido queda viejo en la primera corrección.
 *
 * Solo otorgan los paquetes `approved` y `exempt`. Un paquete `pending` (transferencia en revisión) no
 * otorga nada: si lo hiciera, la cola de revisión se volvería clases gratis.
 *
 * El saldo puede quedar **negativo** y eso es correcto: el trigger que registra el consumo nunca
 * bloquea la toma de asistencia, así que un alumno puede asistir sin crédito. Ese negativo es la deuda
 * de clases que el staff resuelve vendiendo una recarga.
 */
export function computeClassPackBalance(args: ClassPackBalanceArgs): ClassPackBalance {
  const { year, month, packs, consumptions } = args;

  const granted = (packs ?? []).reduce((sum, pack) => {
    if (!inPeriod(pack, year, month)) return sum;
    if (!CLASS_PACK_GRANTING_STATUSES.includes(pack.status)) return sum;
    const count = Number(pack.classCount);
    return Number.isFinite(count) && count > 0 ? sum + count : sum;
  }, 0);

  const consumed = (consumptions ?? []).reduce((sum, row) => {
    if (!inPeriod(row, year, month)) return sum;
    const credits = Number(row.credits);
    return Number.isFinite(credits) && credits > 0 ? sum + credits : sum;
  }, 0);

  return { granted, consumed, balance: granted - consumed };
}
