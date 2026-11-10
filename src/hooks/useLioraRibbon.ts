"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  activeAnchorIndex,
  buildLioraRibbonPath,
  fractionForY,
  lioraPoseFor,
  ribbonSideForText,
  type LioraPoseName,
  type LioraRibbonAnchor,
  type LioraRibbonSample,
  type LioraRibbonSide,
  type LioraTextSide,
} from "@/lib/landing/lioraRibbonPath";

export interface LioraRibbonGeometry {
  d: string;
  width: number;
  height: number;
}

const DESKTOP_MIN = 1024;
const CONTENT_MAX = 1152;
/** The tip follows a reading line a little below the middle of the screen. */
const READING_LINE = 0.58;
const SAMPLE_COUNT = 160;

function ribbonMargin(width: number): number {
  if (width < DESKTOP_MIN) return 12;
  return Math.max(28, (width - CONTENT_MAX) / 4);
}

function readAnchors(layer: HTMLElement): LioraRibbonAnchor[] {
  const top = layer.getBoundingClientRect().top;
  const anchors: LioraRibbonAnchor[] = [];
  let previous: LioraRibbonSide = "start";
  layer.parentElement?.querySelectorAll<HTMLElement>("[data-liora-anchor]").forEach((el, i) => {
    const rect = el.getBoundingClientRect();
    const textSide = (el.dataset.lioraSide ?? "full") as LioraTextSide;
    const side = ribbonSideForText(textSide, previous);
    previous = side;
    const offset = i === 0 ? Math.min(rect.height * 0.5, 360) : 56;
    anchors.push({ y: rect.top - top + offset, side, pose: lioraPoseFor(el.dataset.lioraAnchor ?? "") });
  });
  return anchors;
}

function samplePath(path: SVGPathElement | null, anchors: LioraRibbonAnchor[]): LioraRibbonSample[] {
  if (path && typeof path.getTotalLength === "function") {
    const total = path.getTotalLength();
    if (total > 0) {
      return Array.from({ length: SAMPLE_COUNT + 1 }, (_, i) => {
        const f = i / SAMPLE_COUNT;
        return { f, y: path.getPointAtLength(total * f).y };
      });
    }
  }
  const last = Math.max(anchors.length - 1, 1);
  return anchors.map((a, i) => ({ f: i / last, y: a.y }));
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useLioraRibbon(layerRef: RefObject<HTMLDivElement | null>) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const anchorsRef = useRef<LioraRibbonAnchor[]>([]);
  const samplesRef = useRef<LioraRibbonSample[]>([]);
  const [geometry, setGeometry] = useState<LioraRibbonGeometry | null>(null);
  const [pose, setPose] = useState<LioraPoseName>("arabesque");

  const measure = useCallback(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const { width, height } = layer.getBoundingClientRect();
    const anchors = readAnchors(layer);
    anchorsRef.current = anchors;
    const d = buildLioraRibbonPath(anchors, width, ribbonMargin(width));
    setGeometry((prev) =>
      prev && prev.d === d && prev.width === width && prev.height === height ? prev : d ? { d, width, height } : null,
    );
  }, [layerRef]);

  /** Writes the scroll progress to the layer and returns the pose to show. */
  const paint = useCallback((): LioraPoseName => {
    const layer = layerRef.current;
    if (!layer) return "arabesque";
    const anchors = anchorsRef.current;
    if (prefersReducedMotion()) {
      layer.style.setProperty("--liora-ribbon-progress", "1");
      layer.style.setProperty("--liora-dancer-progress", "0");
      return anchors[0]?.pose ?? "arabesque";
    }
    const y = window.innerHeight * READING_LINE - layer.getBoundingClientRect().top;
    const f = fractionForY(samplesRef.current, y);
    layer.style.setProperty("--liora-ribbon-progress", f.toFixed(4));
    layer.style.setProperty("--liora-dancer-progress", f.toFixed(4));
    return anchors[activeAnchorIndex(anchors, y)]?.pose ?? "arabesque";
  }, [layerRef]);

  const update = useCallback(() => {
    const next = paint();
    setPose((prev) => (prev === next ? prev : next));
  }, [paint]);

  useEffect(() => {
    const layer = layerRef.current;
    const host = layer?.parentElement;
    if (!layer || !host) return;
    measure();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => measure()) : null;
    ro?.observe(host);
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      ro?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [layerRef, measure, update]);

  useEffect(() => {
    if (!geometry) return;
    samplesRef.current = samplePath(pathRef.current, anchorsRef.current);
    paint();
    const frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [geometry, paint, update]);

  return { geometry, pose, pathRef };
}
