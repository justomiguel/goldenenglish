import type { RegistrationAcceptUserLabels } from "@/components/dashboard/AdminRegistrationAcceptForm";
import type { RegistrationStatusFilter } from "@/hooks/useAdminRegistrationsList";
import type { RegistrationInboxFilter } from "@/lib/register/registrationInboxFilter";
import type { RegistrationInboxCounts } from "@/lib/register/countRegistrationInboxFilters";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import type { RegistrationSortKey, RegistrationSortDir } from "@/lib/dashboard/adminRegistrationsSort";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { CountryCode } from "libphonenumber-js";
import type { RegistrationSectionPickerOption } from "@/lib/register/registrationSectionPicker";
import type { RegistrationPageSelection } from "@/hooks/useRegistrationPageSelection";

type RegLabels = Dictionary["admin"]["registrations"];
type TableLabels = Dictionary["admin"]["table"];

export interface RegistrationStatusCounts {
  total: number;
  new: number;
  contacted: number;
}

export interface AdminRegistrationsTableDesktopProps {
  locale: string;
  rows: AdminRegistrationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  sortKey: RegistrationSortKey;
  sortDir: RegistrationSortDir;
  statusFilter?: RegistrationStatusFilter;
  statusCounts: RegistrationStatusCounts;
  inboxFilter?: RegistrationInboxFilter;
  inboxCounts?: RegistrationInboxCounts;
  legalAgeMajority: number;
  instituteName: string;
  /** Default country for phones typed without a prefix; null hides WhatsApp. */
  instituteCountry: CountryCode | null;
  labels: RegLabels;
  tableLabels: TableLabels;
  userLabels: RegistrationAcceptUserLabels;
  currentCohortSections?: CurrentCohortSection[];
  sectionOptionsByCohort?: Record<string, RegistrationSectionPickerOption[]>;
  currentCohortName?: string;
  createSectionHref?: string | null;
  usesCefrLevel?: boolean;
  selection?: RegistrationPageSelection;
  cohorts?: readonly { id: string; name: string }[];
  selectedCohortId?: string | null;
  openCohortId?: string | null;
}
