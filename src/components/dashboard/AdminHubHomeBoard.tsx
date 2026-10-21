"use client";

import { useEffect } from "react";
import { Check, Pencil, X } from "lucide-react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Button } from "@/components/atoms/Button";
import { AdminHubCardMenu } from "@/components/dashboard/AdminHubCardMenu";
import { AdminHubHomeCard, type AdminHubHomeCardModel } from "@/components/dashboard/AdminHubHomeCard";
import { AdminHubHomeAddList } from "@/components/dashboard/AdminHubHomeAddList";
import { AdminHubHomePresetChoices } from "@/components/dashboard/AdminHubHomePresetChoices";
import { AdminHubHomeSlot } from "@/components/dashboard/AdminHubHomeSlot";
import { AdminHubCardSheet } from "@/components/pwa/molecules/AdminHubCardSheet";
import { useAppSurface } from "@/hooks/useAppSurface";
import { useAdminHomeArrange } from "@/hooks/useAdminHomeArrange";
import { setAdminHomeEditMode } from "@/lib/client/adminHomeEditMode";
import { adminHomeCardLabel } from "@/lib/dashboard/adminHomeCardLabel";
import {
  visibleAdminHomeCards,
  type AdminHomeLayout,
  type AdminHomeVisibility,
} from "@/lib/dashboard/adminHomeLayout";

export function AdminHubHomeBoard({
  model,
  layout,
  shopEnabled,
}: {
  model: AdminHubHomeCardModel;
  layout: AdminHomeLayout;
  shopEnabled: boolean;
}) {
  const surface = useAppSurface();
  const phone = surface !== "web-desktop";
  const arrange = useAdminHomeArrange(layout, model.locale, shopEnabled);
  useEffect(() => {
    setAdminHomeEditMode(arrange.editing);
    return () => setAdminHomeEditMode(false);
  }, [arrange.editing]);
  const labels = model.dict.admin.home.layout;
const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const visibility: AdminHomeVisibility = {
    shopEnabled,
    checklistDone: !model.checklist || model.checklist.allDone,
    studentsWithoutSection: model.summary.studentsWithoutSection,
    hasCurrentCohort: model.extras.hasCurrentCohort,
  };
  const placed = visibleAdminHomeCards(arrange.draft, visibility);

  function onDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    arrange.reorder(String(event.active.id), String(event.over.id));
  }

  const grid = (
    <div data-admin-home-grid="" className="grid grid-cols-1 gap-5 lg:flex-1 lg:grid-cols-12">
      {placed.map((card) => {
        const name = adminHomeCardLabel(card.id, model.dict);
        const sizeText =
          card.size === "s"
            ? labels.sizeSmall
            : card.size === "m"
              ? labels.sizeMedium
              : card.size === "l"
                ? labels.sizeLarge
                : labels.sizeRow;
        const open = arrange.editing && arrange.menuId === card.id;
        return (
          <AdminHubHomeSlot
            key={card.id}
            id={card.id}
            size={card.size}
            label={labels.dragHandleAria.replace("{{name}}", name)}
            menuLabel={labels.cardMenuAria.replace("{{name}}", name)}
            resizeLabel={labels.resizeHandleAria.replace("{{name}}", name)}
            resizeValueText={sizeText}
            editing={arrange.editing}
            sortable={arrange.editing && !phone}
            menu={
              open && !phone ? (
                <AdminHubCardMenu
                  id={card.id}
                  title={name}
                  currentSize={card.size}
                  labels={labels}
                  onSize={(size) => arrange.setSize(card.id, size)}
                  onMove={(direction) => arrange.move(card.id, direction)}
                  onHide={() => arrange.hide(card.id)}
                  onClose={() => arrange.setMenuId(null)}
                />
              ) : null
            }
            onOpenMenu={() => arrange.setMenuId(open ? null : card.id)}
            onResize={(size) => arrange.setSize(card.id, size)}
          >
            <AdminHubHomeCard id={card.id} model={model} />
          </AdminHubHomeSlot>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex flex-wrap items-center gap-2 ${
          phone && arrange.editing
            ? "fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-30 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)]"
            : ""
        }`}
      >
        {arrange.editing ? (
          <>
            <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={arrange.cancel} disabled={arrange.busy}>
              <X className="h-4 w-4" aria-hidden />
              {labels.cancel}
            </Button>
            <Button type="button" size="sm" className="min-h-11" onClick={() => void arrange.done()} isLoading={arrange.busy}>
              <Check className="h-4 w-4" aria-hidden />
              {labels.done}
            </Button>
            <AdminHubHomePresetChoices
              labels={labels}
              dict={model.dict}
              draft={arrange.draft}
              visibility={visibility}
              onApply={arrange.applyPreset}
            />
            <AdminHubHomeAddList
              labels={labels}
              dict={model.dict}
              draft={arrange.draft}
              visibility={visibility}
              onShow={arrange.show}
              onHide={arrange.hide}
            />
          </>
        ) : (
          <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={arrange.start}>
            <Pencil className="h-4 w-4" aria-hidden />
            {labels.arrange}
          </Button>
        )}
      </div>
      {arrange.error ? <p className="text-sm text-[var(--color-error)]">{labels.saveError}</p> : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={placed.map((card) => card.id)} strategy={rectSortingStrategy}>
          {grid}
        </SortableContext>
      </DndContext>
      {phone && arrange.menuId ? (
        <AdminHubCardSheet
          id={arrange.menuId}
          title={adminHomeCardLabel(arrange.menuId, model.dict)}
          currentSize={arrange.draft.items.find((item) => item.id === arrange.menuId)?.size}
          labels={labels}
          open
          onOpenChange={(open) => {
            if (!open) arrange.setMenuId(null);
          }}
          onSize={(size) => arrange.setSize(arrange.menuId as NonNullable<typeof arrange.menuId>, size)}
          onMove={(direction) => arrange.move(arrange.menuId as NonNullable<typeof arrange.menuId>, direction)}
          onHide={() => {
            if (arrange.menuId) arrange.hide(arrange.menuId);
          }}
        />
      ) : null}
    </div>
  );
}
