import type { Dictionary } from "@/types/i18n";

type UserLabels = Dictionary["admin"]["users"];

export function fillCount(template: string, count: number): string {
  return template.replace(/\{\{count\}\}/g, String(count));
}

export function deleteSelectedButtonLabel(labels: UserLabels, selectedCount: number): string {
  if (selectedCount === 0) return labels.deleteSelected;
  const template = labels.deleteSelectedWithCount;
  if (typeof template === "string" && template.length > 0) {
    return fillCount(template, selectedCount);
  }
  return `${labels.deleteSelected} (${selectedCount})`;
}

export function toolbarLabelCount(template: string, label: string, count: number): string {
  return template.replace(/\{\{label\}\}/g, label).replace(/\{\{count\}\}/g, String(count));
}
