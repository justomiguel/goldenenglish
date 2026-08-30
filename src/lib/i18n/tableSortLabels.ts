import type { UniversalListSortLabels } from "@/types/universalListView";

const BY_LOCALE: Record<string, UniversalListSortLabels> = {
  es: {
    sortAsc: "orden ascendente",
    sortDesc: "orden descendente",
    sortNeutral: "sin orden en esta columna",
  },
  en: {
    sortAsc: "ascending order",
    sortDesc: "descending order",
    sortNeutral: "no sort on this column",
  },
  pt: {
    sortAsc: "ordem crescente",
    sortDesc: "ordem decrescente",
    sortNeutral: "nenhuma classificação nesta coluna",
  },
};

export function tableSortLabels(locale: string): UniversalListSortLabels {
  return BY_LOCALE[locale] ?? BY_LOCALE.es;
}
