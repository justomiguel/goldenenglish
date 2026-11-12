"use client";

import type { ThemeSection, VariantEditorField } from "@/lib/design-variants/sectionVariant";
import type { DraftOp, DraftScope } from "@/lib/theme-document/editorDraftOps";
import { EditorFieldControl, type SectionLabels } from "./EditorFieldControl";

function propsRecord(props: unknown): Record<string, unknown> {
  if (!props || typeof props !== "object" || Array.isArray(props)) return {};
  return props as Record<string, unknown>;
}

export function SectionTab({
  scope,
  section,
  fields,
  fieldLabels,
  labels,
  onApply,
}: {
  scope: DraftScope;
  section: ThemeSection;
  fields: readonly VariantEditorField[];
  fieldLabels: Record<string, string>;
  labels: SectionLabels;
  onApply: (op: DraftOp) => void;
}) {
  const props = propsRecord(section.props);
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <EditorFieldControl
          key={field.key}
          field={field}
          value={props[field.key]}
          scope={scope}
          sectionId={section.id}
          fieldLabels={fieldLabels}
          labels={labels}
          onApply={onApply}
        />
      ))}
    </div>
  );
}
