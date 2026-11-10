import type { LioraPoseName } from "@/lib/landing/lioraRibbonPath";

interface PoseStrokes {
  head: readonly [number, number];
  strokes: readonly string[];
}

/** Line drawings in a 60×72 box. The head is a small circle; each stroke is a limb or the torso. */
const POSES: Readonly<Record<LioraPoseName, PoseStrokes>> = {
  arabesque: {
    head: [20, 4],
    strokes: [
      "M20 7 C19 18 17 24 15 30",
      "M19 13 C27 8 33 3 37 0",
      "M19 14 C12 16 6 17 2 15",
      "M15 30 C15 42 16 52 18 62",
      "M15 34 C25 31 33 31 40 35",
    ],
  },
  pirouette: {
    head: [20, 4],
    strokes: [
      "M20 7 L20 32",
      "M20 12 C10 14 6 20 10 24 M20 12 C30 14 34 20 30 24",
      "M20 32 L20 62",
      "M20 40 L30 48 L20 52",
    ],
  },
  grandJete: {
    head: [28, 4],
    strokes: [
      "M28 7 C26 16 24 22 22 28",
      "M27 12 C34 6 40 2 46 0",
      "M26 13 C18 9 10 6 4 6",
      "M22 28 C30 34 40 40 52 42",
      "M22 28 C14 34 6 40 -4 42",
    ],
  },
  attitude: {
    head: [20, 4],
    strokes: [
      "M20 7 C20 18 19 24 18 30",
      "M19 12 C14 5 16 0 22 -2",
      "M19 13 C27 15 32 18 34 22",
      "M18 30 L18 62",
      "M18 34 C28 34 32 40 28 48",
    ],
  },
  saute: {
    head: [20, 4],
    strokes: [
      "M20 7 L20 32",
      "M20 12 C14 4 18 -2 20 -4 M20 12 C26 4 22 -2 20 -4",
      "M20 32 C16 44 14 52 16 58",
      "M20 32 C24 44 26 52 24 58",
    ],
  },
  reverence: {
    head: [24, 12],
    strokes: [
      "M23 15 C20 22 18 28 18 34",
      "M22 19 C30 24 36 30 40 36",
      "M22 20 C14 26 8 32 4 36",
      "M18 34 C16 44 14 52 14 62",
      "M18 36 C26 44 32 52 36 62",
    ],
  },
};

export interface LioraDancerPoseProps {
  pose: LioraPoseName | string;
  className?: string;
  strokeWidth?: number;
}

export function lioraPoseStrokes(pose: string): PoseStrokes {
  return POSES[pose as LioraPoseName] ?? POSES.arabesque;
}

/** Decorative ballet figure. Always `aria-hidden`: the dancer carries no information. */
export function LioraDancerPose({ pose, className = "", strokeWidth = 1.6 }: LioraDancerPoseProps) {
  const { head, strokes } = lioraPoseStrokes(pose);
  const known = pose in POSES ? pose : "arabesque";
  return (
    <svg
      viewBox="-8 -8 64 74"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-pose={known}
    >
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={head[0]} cy={head[1]} r={3} fill="currentColor" stroke="none" />
        {strokes.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
