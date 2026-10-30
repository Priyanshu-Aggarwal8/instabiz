import { Box, Point, Stop } from './types';
import { PUPPET_WIDTH } from './puppetConstants';

export { PUPPET_WIDTH };

export const ANCHOR_D: Point = { x: 150, y: 228 };
export const DEFAULT_BOX: Box = [48, 30, 288, 236];

export const STOP_BOXES: Record<string, Box> = {
  sit: [50, 26, 284, 234],
  peek: [148, 34, 280, 163],
  snug: [148, 40, 280, 163],
  bow: [58, 56, 292, 236],
};
export const getStopBox = (pose: string): Box => STOP_BOXES[pose] ?? DEFAULT_BOX;

export const SINK_OFFSET = ANCHOR_D.y - 159;
export const SCALE_LANE = [0.6, 0.86];
export const SCALE_DESKTOP = [0.42, 0.78];
export const RANDOM_TRICKS = ['jump', 'woof', 'love', 'sneeze'];

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const smoothstep = (v: number): number => v * v * (3 - 2 * v);
export const smoothBetween = (from: number, to: number, val: number): number =>
  to === from ? +(val >= to) : smoothstep(clamp01((val - from) / (to - from)));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function getStopPoint(stop: Stop, scrollY: number): Point {
  const track = stop.track;
  let trackY: number;
  if (track.kind === 'page') {
    trackY = track.top - scrollY;
  } else if (track.kind === 'screen') {
    trackY = track.top;
  } else {
    const from = track.from ?? 0;
    const to = track.to ?? 0;
    if (scrollY < from) {
      trackY = track.top - (scrollY - from);
    } else if (scrollY > to) {
      trackY = track.top - (scrollY - to);
    } else {
      trackY = track.top;
    }
  }
  return {
    x: stop.x + ANCHOR_D.x * stop.s,
    y: trackY + ANCHOR_D.y * stop.s,
  };
}

export function findHoldSegment(
  holds: [number, number][],
  scrollY: number
): { k: number; t: number } {
  if (!holds.length || scrollY <= holds[0][1]) return { k: 0, t: 0 };
  for (let i = 0; i < holds.length - 1; i++) {
    const endCurrent = holds[i][1];
    const startNext = holds[i + 1][0];
    if (scrollY < startNext) {
      return {
        k: i,
        t: clamp01((scrollY - endCurrent) / Math.max(1, startNext - endCurrent)),
      };
    }
    if (scrollY <= holds[i + 1][1]) {
      return { k: i + 1, t: 0 };
    }
  }
  return { k: holds.length - 1, t: 0 };
}

export const softClampMax = (val: number, limit: number, radius: number): number => {
  const diff = (val - limit) / radius;
  return diff > 20 ? val : limit + radius * Math.log1p(Math.exp(diff));
};
export const softClampMin = (val: number, limit: number, radius: number): number =>
  -softClampMax(-val, -limit, radius);

export interface SafeBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function clampToSafe(
  x: number,
  y: number,
  scale: number,
  box: Box,
  safe: SafeBounds,
  radius: number = 8
): Point {
  const leftMargin = (ANCHOR_D.x - box[0]) * scale;
  const rightMargin = (box[2] - ANCHOR_D.x) * scale;
  const topMargin = (ANCHOR_D.y - box[1]) * scale;
  const bottomMargin = (box[3] - ANCHOR_D.y) * scale;

  const clampedX =
    safe.right - safe.left > leftMargin + rightMargin
      ? softClampMin(
          softClampMax(x, safe.left + leftMargin, radius),
          safe.right - rightMargin,
          radius
        )
      : (safe.left + safe.right) / 2 - (rightMargin - leftMargin) / 2;

  const clampedY =
    safe.bottom - safe.top > topMargin + bottomMargin
      ? softClampMin(
          softClampMax(y, safe.top + topMargin, radius),
          safe.bottom - bottomMargin,
          radius
        )
      : safe.bottom - bottomMargin;

  return { x: clampedX, y: clampedY };
}

export function lerpBox(b0: Box, b1: Box, t: number): Box {
  return [
    lerp(b0[0], b1[0], t),
    lerp(b0[1], b1[1], t),
    lerp(b0[2], b1[2], t),
    lerp(b0[3], b1[3], t),
  ];
}

export function evalCubicBezier(p0: Point, c1: Point, c2: Point, p1: Point, t: number): Point {
  const inv = 1 - t;
  const c0 = inv * inv * inv;
  const c1Coeff = 3 * inv * inv * t;
  const c2Coeff = 3 * inv * t * t;
  const c3 = t * t * t;
  return {
    x: c0 * p0.x + c1Coeff * c1.x + c2Coeff * c2.x + c3 * p1.x,
    y: c0 * p0.y + c1Coeff * c1.y + c2Coeff * c2.y + c3 * p1.y,
  };
}

export const setDataset = (el: HTMLElement, key: string, val: string): void => {
  if (el.dataset[key] !== val) el.dataset[key] = val;
};

