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

export type EspacioZenitGalleryStripHandle = {
  step: (delta: number) => void;
};

export interface UseEspacioZenitGalleryStripArgs {
  images: readonly string[];
  activeIndex: number;
  onActiveIndexChange?: (index: number) => void;
}

export interface UseEspacioZenitGalleryStripResult {
  viewportRef: RefObject<HTMLDivElement | null>;
  trackRef: RefObject<HTMLUListElement | null>;
  loopedImages: ReturnType<typeof buildLoopedGallerySlides>;
  translatePx: number;
  transitionEnabled: boolean;
  onTrackTransitionEnd: (e: TransitionEvent<HTMLUListElement>) => void;
  remeasure: () => void;
  step: (delta: number) => void;
}

export function useEspacioZenitGalleryStrip({
  images,
  activeIndex,
  onActiveIndexChange,
}: UseEspacioZenitGalleryStripArgs): UseEspacioZenitGalleryStripResult {
  const total = images.length;
  const looped = useMemo(() => buildLoopedGallerySlides(images), [images]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const pendingSnapRef = useRef(false);
  const lastReportedLogicalRef = useRef(activeIndex);
  const prevActiveIndexRef = useRef(activeIndex);

  const [trackOffset, setTrackOffset] = useState(() =>
    total > 1 ? middleTrackOffset(activeIndex, total) : activeIndex,
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

  useEffect(() => {
    if (activeIndex === prevActiveIndexRef.current) return;
    prevActiveIndexRef.current = activeIndex;

    const syncTrackToActiveIndex = () => {
      if (total <= 1) {
        setTrackOffset(activeIndex);
        return;
      }
      setTrackOffset((offset) => {
        if (logicalIndexFromTrackOffset(offset, total) === activeIndex) return offset;
        pendingSnapRef.current = true;
        setTransitionEnabled(false);
        lastReportedLogicalRef.current = activeIndex;
        return middleTrackOffset(activeIndex, total);
      });
    };

    queueMicrotask(syncTrackToActiveIndex);
  }, [activeIndex, total]);

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

  return {
    viewportRef,
    trackRef,
    loopedImages: looped,
    translatePx,
    transitionEnabled,
    onTrackTransitionEnd,
    remeasure: measureCenter,
    step,
  };
}
