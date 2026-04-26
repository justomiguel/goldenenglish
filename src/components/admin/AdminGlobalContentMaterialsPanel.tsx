"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";

export type AdminGlobalDraftMaterial = {
  id: string;
  kind: "file" | "embed";
  existingAssetId?: string;
  uploadedAssetId?: string;
  storagePath?: string;
  label: string;
  url?: string;
  filename?: string;
  contentType?: string;
  byteSize?: number;
};

interface AdminGlobalContentMaterialsPanelProps {
  labels: Dictionary["dashboard"]["adminContents"];
  materials: AdminGlobalDraftMaterial[];
  materialLabel: string;
  embedUrl: string;
  isUploading: boolean;
  onMaterialLabelChange: (value: string) => void;
  onEmbedUrlChange: (value: string) => void;
  onAddEmbed: () => void;
  onAddFiles: (files: File[]) => void;
  onReorderMaterials: (materials: AdminGlobalDraftMaterial[]) => void;
  onMoveMaterial: (index: number, direction: -1 | 1) => void;
  onRemoveMaterial: (material: AdminGlobalDraftMaterial) => void;
}

export function AdminGlobalContentMaterialsPanel({
  labels,
  materials,
  materialLabel,
  embedUrl,
  isUploading,
  onMaterialLabelChange,
  onEmbedUrlChange,
  onAddEmbed,
  onAddFiles,
  onReorderMaterials,
  onMoveMaterial,
  onRemoveMaterial,
}: AdminGlobalContentMaterialsPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = materials.findIndex((material) => material.id === active.id);
    const newIndex = materials.findIndex((material) => material.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorderMaterials(arrayMove(materials, oldIndex, newIndex));
  };

  return (
    <>
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">{labels.draftMaterialsTitle}</h3>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.draftMaterialsLead}</p>
        <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_1fr_auto]">
          <Input value={materialLabel} onChange={(e) => onMaterialLabelChange(e.target.value)} placeholder={labels.materialLabelPlaceholder} />
          <Input value={embedUrl} onChange={(e) => onEmbedUrlChange(e.target.value)} placeholder={labels.embedUrlPlaceholder} />
          <Button type="button" onClick={onAddEmbed} disabled={!materialLabel.trim() || !embedUrl.trim()}>
            <Link2 className="h-4 w-4 shrink-0" aria-hidden />
            {labels.builderAddEmbed}
          </Button>
        </div>
        <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="global-content-file">{labels.builderFileLabel}</Label>
            <Input
              id="global-content-file"
              type="file"
              multiple
              accept="application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/png,image/jpeg,image/webp,audio/mpeg,audio/mp4,audio/wav,audio/webm,video/mp4,video/webm"
              disabled={isUploading}
              onChange={(e) => {
                const list = e.target.files ? Array.from(e.target.files) : [];
                e.target.value = "";
                if (list.length > 0) onAddFiles(list);
              }}
            />
          </div>
          <span className="self-center text-xs text-[var(--color-muted-foreground)]">{labels.builderFileHint}</span>
        </div>
      </div>
      {materials.length === 0 ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.noMaterialsDraft}</p> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={materials.map((material) => material.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {materials.map((material, index) => (
                <SortableMaterialItem
                  key={material.id}
                  material={material}
                  index={index}
                  total={materials.length}
                  labels={labels}
                  onMoveMaterial={onMoveMaterial}
                  onRemoveMaterial={onRemoveMaterial}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </>
  );
}

function SortableMaterialItem({
  material,
  index,
  total,
  labels,
  onMoveMaterial,
  onRemoveMaterial,
}: {
  material: AdminGlobalDraftMaterial;
  index: number;
  total: number;
  labels: Dictionary["dashboard"]["adminContents"];
  onMoveMaterial: (index: number, direction: -1 | 1) => void;
  onRemoveMaterial: (material: AdminGlobalDraftMaterial) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: material.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 ${isDragging ? "opacity-70 ring-2 ring-[var(--color-primary)]" : ""}`}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm">
        <button
          type="button"
          className="cursor-grab rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-muted-foreground)] active:cursor-grabbing"
          aria-label={labels.dragMaterial}
          title={labels.dragMaterial}
          {...attributes}
          {...listeners}
        >
          {labels.dragHandle}
        </button>
        <span className="min-w-0">
          <span className="block font-medium text-[var(--color-foreground)]">{material.label}</span>
          <span className="block truncate text-xs text-[var(--color-muted-foreground)]">
            {material.kind === "embed" ? labels.embedKind : material.filename ?? material.contentType ?? labels.fileKind}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => onMoveMaterial(index, -1)} disabled={index === 0} aria-label={labels.moveUp} title={labels.moveUp}>
          <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onMoveMaterial(index, 1)} disabled={index === total - 1} aria-label={labels.moveDown} title={labels.moveDown}>
          <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveMaterial(material)}>
          <Trash2 className="h-3.5 w-3.5 shrink-0 text-[var(--color-foreground)]" aria-hidden />
          {labels.remove}
        </Button>
      </span>
    </li>
  );
}
