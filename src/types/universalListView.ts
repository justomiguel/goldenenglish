export type UniversalSortDir = "asc" | "desc";

export interface UniversalListSortColumn {
  id: string;
  label: string;
  sortable?: boolean;
  className?: string;
  thClassName?: string;
}

export interface UniversalListSortLabels {
  sortAsc: string;
  sortDesc: string;
  sortNeutral: string;
}
