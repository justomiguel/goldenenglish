"use client";

import { createContext, use } from "react";
import type { GenericPhotoSection } from "@/lib/landing/genericSectionPhotos";

type PhotoMap = Partial<Record<GenericPhotoSection, string>>;

const PhotosContext = createContext<PhotoMap>({});

export function GenericPhotos({
  photos,
  children,
}: {
  photos: PhotoMap;
  children: React.ReactNode;
}) {
  return <PhotosContext value={photos}>{children}</PhotosContext>;
}

export function GenericSectionPhoto({
  section,
  alt,
  placement = "frame",
}: {
  section: GenericPhotoSection;
  alt?: string;
  placement?: "hero" | "frame";
}) {
  const src = use(PhotosContext)[section];
  if (!src) return null;
  if (placement === "hero") {
    return (
      <>
        <img src={src} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 z-0 bg-[color-mix(in_srgb,var(--color-background)_72%,transparent)]" />
      </>
    );
  }
  return (
    <img src={src} alt={alt ?? ""} className="mb-8 aspect-[16/9] w-full max-w-3xl object-cover" />
  );
}

export function GenericSlotLead({
  title,
  body,
  section,
}: {
  title: string;
  body: string;
  section?: GenericPhotoSection;
}) {
  if (!title.trim() && !body.trim() && !section) return null;
  return (
    <header className="relative z-10 mb-10 max-w-2xl">
      {section ? <GenericSectionPhoto section={section} alt={title} /> : null}
      {title.trim() ? <p className="text-sm font-semibold text-[var(--color-primary)]">{title}</p> : null}
      {body.trim() ? <p className="mt-3 text-lg leading-relaxed">{body}</p> : null}
    </header>
  );
}
