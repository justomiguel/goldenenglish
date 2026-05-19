"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type TransitionEvent,
} from "react";
import {
  buildLoopedGallerySlides,
  logicalIndexFromTrackOffset,
  middleTrackOffset,
  snapTrackOffsetAfterTransition,
} from "@/lib/landing/buildLoopedGallerySlides";

const EMPTY_GALLERY_IMAGES: readonly string[] = [];

export type EspacioZenitGalleryStripHandle = {
  step: (delta: number) => void;
  goToIndex: (index: number) => void;
};

export interface UseEspacioZenitGalleryStripArgs {
  images: readonly string[];
  onActiveIndexChange?: (index: number) => void;
}

export interface UseEspacioZenitGalleryStripResult {
  viewportRef: RefObject<HTMLDivElement | null>;
  trackRef: RefObject<HTMLUListElement | null>;
  loopedImages: ReturnType<typeof buildLoopedGallerySlides>;
  activeIndex: number;
  translatePx: number;
  transitionEnabled: boolean;
  onTrackTransitionEnd: (e: TransitionEvent<HTMLUListElement>) => void;
  remeasure: () => void;
  step: (delta: number) => void;
  goToIndex: (index: number) => void;
}

export function useEspacioZenitGalleryStrip({
  images: imagesArg,
  onActiveIndexChange,
}: UseEspacioZenitGalleryStripArgs): UseEspacioZenitGalleryStripResult {
  const images = imagesArg ?? EMPTY_GALLERY_IMAGES;
  const total = images.length;
  const looped = useMemo(() => buildLoopedGallerySlides(images), [images]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const pendingSnapRef = useRef(false);
  const lastReportedLogicalRef = useRef(0);

  const [trackOffset, setTrackOffset] = useState(() =>
    total > 1 ? middleTrackOffset(0, total) : 0,
  );
  const [translatePx, setTranslatePx] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const measureCenterForOffset = useCallback((offset: number) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const item = track.children.item(offset) as HTMLElement | null;
    if (!item) return;
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    setTranslatePx(viewport.clientWidth / 2 - itemCenter);
  }, []);

  const measureCenter = useCallback(() => {
    measureCenterForOffset(trackOffset);
  }, [measureCenterForOffset, trackOffset]);

  useEffect(() => {
    measureCenter();
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const ro = new ResizeObserver(() => measureCenter());
    ro.observe(viewport);
    ro.observe(track);
    window.addEventListener("resize", measureCenter);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureCenter);
    };
  }, [measureCenter, total]);

  useLayoutEffect(() => {
    if (!pendingSnapRef.current) return;
    pendingSnapRef.current = false;
    measureCenterForOffset(trackOffset);
    const id = requestAnimationFrame(() => setTransitionEnabled(true));
    return () => cancelAnimationFrame(id);
  }, [trackOffset, measureCenterForOffset]);

  useEffect(() => {
    if (total <= 1) return;
    const logical = logicalIndexFromTrackOffset(trackOffset, total);
    if (logical === lastReportedLogicalRef.current) return;
    lastReportedLogicalRef.current = logical;
    onActiveIndexChange?.(logical);
  }, [trackOffset, total, onActiveIndexChange]);

  const goToIndex = useCallback(
    (index: number) => {
      if (total <= 0) return;
      const clamped = Math.max(0, Math.min(index, total - 1));
      if (total <= 1) {
        setTrackOffset(clamped);
        return;
      }
      setTrackOffset((offset) => {
        if (logicalIndexFromTrackOffset(offset, total) === clamped) return offset;
        pendingSnapRef.current = true;
        setTransitionEnabled(false);
        lastReportedLogicalRef.current = clamped;
        return middleTrackOffset(clamped, total);
      });
    },
    [total],
  );

  const step = useCallback(
    (delta: number) => {
      if (total <= 1 || delta === 0) return;
      setTransitionEnabled(true);
      setTrackOffset((offset) => offset + delta);
    },
    [total],
  );

  const snapWithoutTransition = useCallback((nextOffset: number) => {
    pendingSnapRef.current = true;
    setTransitionEnabled(false);
    setTrackOffset(nextOffset);
  }, []);

  const onTrackTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLUListElement>) => {
      if (e.propertyName !== "transform" || total <= 1) return;
      if (e.target !== trackRef.current) return;

      const snapTo = snapTrackOffsetAfterTransition(trackOffset, total);
      if (snapTo !== null) snapWithoutTransition(snapTo);
    },
    [snapWithoutTransition, total, trackOffset],
  );

  const activeIndex =
    total <= 1 ? trackOffset : logicalIndexFromTrackOffset(trackOffset, total);

  return {
    viewportRef,
    trackRef,
    loopedImages: looped,
    activeIndex,
    translatePx,
    transitionEnabled,
    onTrackTransitionEnd,
    remeasure: measureCenter,
    step,
    goToIndex,
  };
}
