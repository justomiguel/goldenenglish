"use client";

import { useState } from "react";
import { Expand, Palette } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { TemplatePreviewLoader } from "@/components/molecules/TemplatePreviewLoader";
import {
  genericKindDefaultPalette,
  type GenericInstituteKind,
  type GenericTemplatePalette,
} from "@/lib/theme/genericInstituteTemplates";
import { templatePreviewHref } from "@/lib/theme/templatePalette";
import type { Dictionary } from "@/types/i18n";

export interface PulsarTemplatePreview {
  kind: GenericInstituteKind;
  name: string;
  alt: string;
  src: string;
}

const overlayButtonClass =
  "inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-[var(--layout-border-radius)] bg-[var(--color-surface)] px-2 text-xs font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-muted)]";

export function PulsarTemplatePicker({
  locale,
  copy,
  previews,
  kind,
  onKindChange,
}: {
  locale: string;
  copy: Dictionary["pulsar"]["account"];
  previews: readonly PulsarTemplatePreview[];
  kind: GenericInstituteKind;
  onKindChange: (kind: GenericInstituteKind) => void;
}) {
  const [colors, setColors] = useState<Record<string, GenericTemplatePalette>>(() =>
    Object.fromEntries(previews.map((item) => [item.kind, genericKindDefaultPalette(item.kind)])),
  );
  const [openKind, setOpenKind] = useState<GenericInstituteKind | null>(null);
  const [loadedSrc, setLoadedSrc] = useState("");
  const openPreview = previews.find((item) => item.kind === openKind) ?? null;
  const openPalette = openKind ? colors[openKind] ?? genericKindDefaultPalette(openKind) : null;
  const selected = colors[kind] ?? genericKindDefaultPalette(kind);

  function setChannel(channel: keyof GenericTemplatePalette, value: string) {
    if (!openKind) return;
    setColors((current) => ({
      ...current,
      [openKind]: { ...(current[openKind] ?? genericKindDefaultPalette(openKind)), [channel]: value },
    }));
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold">{copy.template}</legend>
      <input type="hidden" name="colorPrimary" value={selected.primary} />
      <input type="hidden" name="colorAccent" value={selected.accent} />
      <input type="hidden" name="colorPaper" value={selected.paper} />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {previews.map((item) => {
          const palette = colors[item.kind] ?? genericKindDefaultPalette(item.kind);
          const selectedCard = kind === item.kind;
          return (
            <div key={item.kind} className="group relative">
              <label
                className={`block min-h-11 cursor-pointer overflow-hidden rounded-[var(--layout-border-radius)] border bg-[var(--color-surface)] focus-within:ring-2 focus-within:ring-[var(--color-primary)] ${
                  selectedCard ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="kind"
                  value={item.kind}
                  checked={selectedCard}
                  onChange={() => onKindChange(item.kind)}
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- captured screenshot in public/generic */}
                <img
                  src={item.src}
                  alt={item.alt}
                  width={1440}
                  height={900}
                  className="aspect-video w-full object-cover object-top"
                />
                <span className="block px-2 pt-2 text-sm font-semibold text-[var(--color-foreground)]">{item.name}</span>
                <span className="flex gap-1 px-2 pb-2" aria-hidden>
                  <span className="h-3 w-3 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: palette.primary }} />
                  <span className="h-3 w-3 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: palette.accent }} />
                  <span className="h-3 w-3 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: palette.paper }} />
                </span>
              </label>
              <div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-video flex-col justify-center gap-2 bg-[var(--color-foreground)]/55 p-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 max-sm:pointer-events-auto max-sm:opacity-100">
                <button type="button" className={overlayButtonClass} onClick={() => setOpenKind(item.kind)}>
                  <Expand className="h-3.5 w-3.5" aria-hidden />
                  {copy.templateEnlarge}
                </button>
                <button type="button" className={overlayButtonClass} onClick={() => setOpenKind(item.kind)}>
                  <Palette className="h-3.5 w-3.5" aria-hidden />
                  {copy.templateColors}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Modal
        open={openPreview !== null && openPalette !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenKind(null);
            setLoadedSrc("");
          }
        }}
        titleId="template-preview-title"
        title={openPreview ? copy.templatePreviewTitle.replaceAll("{name}", openPreview.name) : copy.template}
        dialogClassName="!max-w-5xl"
      >
        {openPreview && openPalette ? (
          <div className="space-y-4 p-4">
            <TemplateFrame
              title={copy.templatePreviewTitle.replaceAll("{name}", openPreview.name)}
              src={templatePreviewHref(locale, openPreview.kind, openPalette)}
              locale={locale}
              loadingLabel={copy.templatePreviewLoading}
              loadedSrc={loadedSrc}
              onLoad={setLoadedSrc}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <ColorField
                id="template-primary"
                label={copy.templateColorPrimary}
                value={openPalette.primary}
                onChange={(value) => setChannel("primary", value)}
              />
              <ColorField
                id="template-accent"
                label={copy.templateColorAccent}
                value={openPalette.accent}
                onChange={(value) => setChannel("accent", value)}
              />
              <ColorField
                id="template-paper"
                label={copy.templateColorPaper}
                value={openPalette.paper}
                onChange={(value) => setChannel("paper", value)}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </fieldset>
  );
}

function TemplateFrame({
  title,
  src,
  locale,
  loadingLabel,
  loadedSrc,
  onLoad,
}: {
  title: string;
  src: string;
  locale: string;
  loadingLabel: string;
  loadedSrc: string;
  onLoad: (src: string) => void;
}) {
  const [coverSrc, setCoverSrc] = useState(src);
  const [visible, setVisible] = useState(true);
  if (coverSrc !== src) {
    setCoverSrc(src);
    setVisible(true);
  }
  const ready = loadedSrc === src;
  return (
    <div className="relative h-[60vh] overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
      <iframe
        title={title}
        src={src}
        onLoad={(event) => onLoad(event.currentTarget.getAttribute("src") ?? "")}
        className="h-full w-full bg-[var(--color-background)]"
      />
      {visible ? (
        <div className="absolute inset-0">
          <TemplatePreviewLoader
            label={loadingLabel}
            locale={locale}
            complete={ready}
            onDone={() => setVisible(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <input
        id={id}
        type="color"
        value={value.toLowerCase()}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="mt-1 h-11 w-full cursor-pointer rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]"
      />
    </label>
  );
}
