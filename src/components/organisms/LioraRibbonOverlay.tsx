"use client";

import { useRef, useSyncExternalStore } from "react";
import { LioraDancerPose } from "@/components/atoms/LioraDancerPose";
import { useLioraRibbon } from "@/hooks/useLioraRibbon";

const WIDE_QUERY = "(min-width: 768px)";

function subscribeWide(onStoreChange: () => void) {
  const media = window.matchMedia(WIDE_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function wideSnapshot() {
  return window.matchMedia(WIDE_QUERY).matches;
}

/**
 * Rose ribbon that draws itself down the landing while the page scrolls.
 * The logo dancer rides its tip and takes the pose of each section.
 * Mount it as a direct child of the element that holds the
 * `[data-liora-anchor]` sections. Pure decoration: hidden from readers.
 * Below md the ribbon would cross the single text column, so it does not mount.
 */
export function LioraRibbonOverlay() {
  const wide = useSyncExternalStore(subscribeWide, wideSnapshot, () => false);
  return wide ? <LioraRibbonLayer /> : null;
}

function LioraRibbonLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const { geometry, pose, pathRef } = useLioraRibbon(layerRef);

  return (
    <div ref={layerRef} aria-hidden="true" className="liora-ribbon-layer" data-ready={geometry ? "true" : "false"}>
      {geometry ? (
        <>
          <svg
            className="liora-ribbon-svg"
            width={geometry.width}
            height={geometry.height}
            viewBox={`0 0 ${geometry.width} ${geometry.height}`}
            focusable="false"
          >
            <path d={geometry.d} pathLength={1} className="liora-ribbon-sheen" />
            <path ref={pathRef} d={geometry.d} pathLength={1} className="liora-ribbon-path" />
          </svg>
          <div className="liora-ribbon-dancer" style={{ offsetPath: `path("${geometry.d}")` }}>
            <span key={pose} className="liora-ribbon-pose" data-pose={pose}>
              <LioraDancerPose pose={pose} strokeWidth={2.2} className="h-full w-full" />
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
