"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { CATALOG_MATERIAL_KINDS } from "@/lib/courses/catalogMaterial";
import type { Dictionary } from "@/types/i18n";

const fieldClass =
  "block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2";

const materialLabelKey = {
  video_embed: "catalogMaterialVideo",
  pdf: "catalogMaterialPdf",
  quiz: "catalogMaterialQuiz",
  image: "catalogMaterialImage",
  audio: "catalogMaterialAudio",
} as const;

interface TeacherCatalogFiltersProps {
  locale: string;
  tag: string;
  material: string;
  labels: Dictionary["dashboard"]["adminContents"];
}

export function TeacherCatalogFilters({ locale, tag, material, labels }: TeacherCatalogFiltersProps) {
  const router = useRouter();
  const [draftTag, setDraftTag] = useState(tag);
  const [draftMaterial, setDraftMaterial] = useState(material);

  return (
    <form
      className="mb-4 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        const nextTag = draftTag.trim();
        if (nextTag) params.set("tag", nextTag);
        if (draftMaterial) params.set("material", draftMaterial);
        const qs = params.toString();
        router.replace(`/${locale}/dashboard/teacher/tasks${qs ? `?${qs}` : ""}`);
      }}
    >
      <label className="min-w-[12rem] flex-1 space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogTag}
        <input className={fieldClass} value={draftTag} maxLength={40} onChange={(event) => setDraftTag(event.target.value)} />
      </label>
      <label className="min-w-[10rem] space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogMaterial}
        <select className={fieldClass} value={draftMaterial} onChange={(event) => setDraftMaterial(event.target.value)}>
          <option value="">{labels.catalogMaterialAny}</option>
          {CATALOG_MATERIAL_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {labels[materialLabelKey[kind]]}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="secondary">
        <Search className="h-4 w-4" aria-hidden />
        {labels.catalogTagApply}
      </Button>
    </form>
  );
}
