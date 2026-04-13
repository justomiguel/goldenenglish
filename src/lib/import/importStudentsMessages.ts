import type { Dictionary } from "@/types/i18n";
import type { BulkImportResult } from "@/lib/import/bulkImportStudents";
import {
  IMPORT_ROW_AUTH_ERROR,
  IMPORT_ROW_EMAIL_DNI_CONFLICT,
  IMPORT_ROW_EMAIL_DNI_MISMATCH,
  IMPORT_ROW_ENROLLMENT_FAILED,
  IMPORT_ROW_EXISTING_NON_STUDENT,
  IMPORT_ROW_NOOP,
  IMPORT_ROW_NO_USER_ID,
  IMPORT_ROW_PROFILE_MISSING,
  IMPORT_ROW_PROFILE_UPDATE_FAILED,
  IMPORT_ROW_SUCCESS,
  IMPORT_ROW_UNKNOWN,
} from "@/lib/import/importResultMessageCodes";
import {
  IMPORT_INVALID_CSV_PAYLOAD,
  IMPORT_PARSE_CSV_FAILED,
  IMPORT_PARSE_EMPTY_WORKBOOK,
  IMPORT_PARSE_EXCEL_FAILED,
} from "@/lib/import/parseImportErrorCodes";
import { IMPORT_JOB_CANCELLED_BY_USER } from "@/lib/import/importJobErrorCodes";

type ImportLabels = Dictionary["admin"]["import"];

function resolveImportRowDetailMessage(code: string, labels: ImportLabels): string {
  switch (code) {
    case IMPORT_ROW_EMAIL_DNI_MISMATCH:
      return labels.rowResultEmailDniMismatch;
    case IMPORT_ROW_NO_USER_ID:
      return labels.rowResultNoUserId;
    case IMPORT_ROW_PROFILE_MISSING:
      return labels.rowResultProfileMissing;
    case IMPORT_ROW_EXISTING_NON_STUDENT:
      return labels.rowResultExistingNonStudent;
    case IMPORT_ROW_EMAIL_DNI_CONFLICT:
      return labels.rowResultEmailDniConflict;
    case IMPORT_ROW_NOOP:
      return labels.rowResultNoop;
    case IMPORT_ROW_SUCCESS:
      return labels.rowResultSuccess;
    case IMPORT_ROW_AUTH_ERROR:
      return labels.rowResultAuthError;
    case IMPORT_ROW_PROFILE_UPDATE_FAILED:
      return labels.rowResultProfileUpdateFailed;
    case IMPORT_ROW_ENROLLMENT_FAILED:
      return labels.rowResultEnrollmentFailed;
    case IMPORT_ROW_UNKNOWN:
      return labels.rowResultUnknownError;
    default:
      return labels.rowResultUnknownError;
  }
}

export function resolveParseErrorOrUnknown(code: string, labels: ImportLabels): string {
  return resolveParseErrorLine(code, labels) ?? labels.unknownError;
}

function resolveParseErrorLine(code: string, labels: ImportLabels): string | null {
  switch (code) {
    case IMPORT_PARSE_EMPTY_WORKBOOK:
      return labels.parseEmptyWorkbook;
    case IMPORT_PARSE_EXCEL_FAILED:
      return labels.parseExcelFailed;
    case IMPORT_PARSE_CSV_FAILED:
      return labels.parseCsvFailed;
    default:
      return null;
  }
}

export function resolveImportSurfaceMessage(raw: string | undefined, labels: ImportLabels): string {
  if (!raw) return labels.unknownError;
  if (raw === IMPORT_INVALID_CSV_PAYLOAD) return labels.invalidCsvPayload;
  if (raw === IMPORT_JOB_CANCELLED_BY_USER) return labels.importCancelledByUser;
  const parseLine = resolveParseErrorLine(raw, labels);
  if (parseLine) return parseLine;
  return resolveImportRowDetailMessage(raw, labels);
}

export function formatImportDoneSummary(labels: ImportLabels, result: BulkImportResult) {
  const failed = result.results.filter((r) => !r.ok);
  const base = `${labels.done}: ${result.processed} ${labels.rows}, +${result.createdUsers} ${labels.users}, +${result.profilesUpdated} ${labels.profileUpdates}, ${result.skippedNoop} ${labels.skippedNoop}, +${result.enrolled} ${labels.enrollments}, +${result.paymentsSeeded} ${labels.paymentSlots}`;
  const hint = labels.importSummaryCountHint
    .replace("{{processed}}", String(result.processed))
    .replace("{{createdUsers}}", String(result.createdUsers))
    .replace("{{profilesUpdated}}", String(result.profilesUpdated))
    .replace("{{skippedNoop}}", String(result.skippedNoop));
  const summary = `${base}\n\n${hint}`;
  const detail =
    failed.length > 0
      ? failed
          .map(
            (f) =>
              `${labels.row} ${f.rowIndex}: ${resolveImportRowDetailMessage(f.message, labels)}`,
          )
          .join("\n")
      : null;
  return { summary, detail };
}
