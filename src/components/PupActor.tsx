'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Puppet } from './pup/Puppet';
import {
  PUPPET_WIDTH,
  ANCHOR_D,
  DEFAULT_BOX,
  STOP_BOXES,
  SCALE_LANE,
  SCALE_DESKTOP,
  SINK_OFFSET,
  RANDOM_TRICKS,
  clamp01,
  smoothstep,
  smoothBetween,
  lerp,
  getStopPoint,
  findHoldSegment,
  clampToSafe,
  lerpBox,
  evalCubicBezier,
  getStopBox,
  setDataset,
  SafeBounds,
} from './pup/pupEngine';
import { PUPPET_MOTIONS, emitHearts, pickTrick, QueuedAction } from './pup/puppetMotions';
import { Journey, Stop, StopMeta, EvaluatedStep, Point } from './pup/types';
import { POSES } from './pup/puppetConstants';

function computeJourney(probe: HTMLElement): Journey {
  const isMobile = matchMedia(
    '(max-width: 767px), (pointer: coarse) and (max-height: 519px)'
  ).matches;
  const clientWidth = document.documentElement.clientWidth;
  const clientHeight = probe.getBoundingClientRect().height || window.innerHeight;
  const headerHeight =
    document.getElementById('site-header')?.offsetHeight ?? 76;
  const whatsappEl = document.querySelector('[data-whatsapp-bar]');
  const whatsappHeight = whatsappEl?.getClientRects().length
    ? whatsappEl.getBoundingClientRect().height
    : 0;

  const safeBounds: SafeBounds = {
    left: 10,
    top: headerHeight + 10,
    right: clientWidth - 10,
    bottom: clientHeight - 10 - whatsappHeight,
  };

  const mainEl = document.getElementById('main');
  const stops: Stop[] = [];
  const meta: StopMeta[] = [];
  const holdIntervals: [number, number][] = [];

  // On desktop (min-width: 1024px), ensure tp-meet__teddy has pose="walk" and act="treadmill"
  const meetStop = document.querySelector('.tp-meet__teddy') as HTMLElement | null;
  if (meetStop) {
    if (window.innerWidth >= 1024) {
      meetStop.dataset.pose = 'walk';
      meetStop.dataset.act = 'treadmill';
    } else {
      meetStop.dataset.pose = 'sit';
      delete meetStop.dataset.act;
    }
  }

  const processStopElement = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const pose = el.dataset.pose || 'sit';
    const act = el.dataset.act ?? '';
    const baseScale = rect.width / 300;
    const scale = act === 'basket' || isMobile ? baseScale : 1.12 * baseScale;
    const pivot = pose === 'peek' ? { x: ANCHOR_D.x, y: 159 } : ANCHOR_D;

    // Detect sticky parent
    const findStickyParent = (child: HTMLElement): HTMLElement | null => {
      for (
        let p = child.parentElement;
        p && p !== document.body;
        p = p.parentElement
      ) {
        if (getComputedStyle(p).position === 'sticky') return p;
      }
      return null;
    };

    const sticky = findStickyParent(el);
    let trackKind: 'page' | 'pin' = 'page';
    let trackTop = rect.top + window.scrollY;
    let trackFrom = 0;
    let trackTo = 0;

    if (sticky) {
      const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
      const offsetInSticky = rect.top - sticky.getBoundingClientRect().top;
      const prevPos = sticky.style.position;
      sticky.style.position = 'relative';
      const stickyRect = sticky.getBoundingClientRect();
      const parent = sticky.parentElement;
      const parentBottom = parent
        ? parent.getBoundingClientRect().bottom -
          (parseFloat(getComputedStyle(parent).paddingBottom) || 0)
        : 0;
      sticky.style.position = prevPos;

      const fromY = stickyRect.top + window.scrollY - stickyTop;
      const toY = parentBottom + window.scrollY - stickyRect.height - stickyTop;
      if (toY <= fromY) {
        trackKind = 'page';
        trackTop = stickyRect.top + window.scrollY + offsetInSticky;
      } else {
        trackKind = 'pin';
        trackTop = stickyTop + offsetInSticky;
        trackFrom = fromY;
        trackTo = toY;
      }
    }

    trackTop += pivot.y * (baseScale - scale);

    const stopObj: Stop = {
      x: rect.left + pivot.x * (baseScale - scale),
      track:
        trackKind === 'pin'
          ? { kind: 'pin', top: trackTop, from: trackFrom, to: trackTo }
          : { kind: 'page', top: trackTop },
      s: scale,
      behind: el.dataset.behind === 'true',
      sink: 0,
      box: getStopBox(pose),
    };

    const scene = el.closest('[data-pup-scene]') as HTMLElement | null;
    stops.push(stopObj);
    meta.push({
      scene,
      pose,
      facing: el.dataset.facing === 'left' ? -1 : 1,
      act,
      looks: scene ? (Array.from(scene.querySelectorAll('[data-pup-look]')) as HTMLElement[]) : [],
      track:
        act === 'treadmill'
          ? (scene?.querySelector('[data-treadmill]') as HTMLElement | null)
          : null,
    });

    // Compute hold interval for stop
    let holdRange: [number, number];
    if (stopObj.track.kind === 'pin') {
      holdRange = [stopObj.track.from ?? 0, stopObj.track.to ?? 0];
    } else {
      const topY = stopObj.track.top;
      const boxTop = topY + stopObj.box[1] * stopObj.s;
      const boxBottom = topY + stopObj.box[3] * stopObj.s;
      const boxCenter = (boxTop + boxBottom) / 2;
      const safeH = safeBounds.bottom - safeBounds.top;
      const scaleRef = isMobile ? SCALE_LANE : SCALE_DESKTOP;
      let holdStart = boxCenter - (safeBounds.top + scaleRef[1] * safeH);
      let holdEnd = boxCenter - (safeBounds.top + scaleRef[0] * safeH);
      holdStart = Math.max(holdStart, boxBottom - safeBounds.bottom);
      if (holdStart > (holdEnd = Math.min(holdEnd, boxTop - safeBounds.top))) {
        holdStart = holdEnd = boxCenter - (safeBounds.top + safeH / 2);
      }
      holdRange = [holdStart, holdEnd];
    }

    if (
      !isMobile &&
      scene &&
      stopObj.track.kind === 'page' &&
      act !== 'basket' &&
      act !== 'peekaboo'
    ) {
      const safeH = safeBounds.bottom - safeBounds.top;
      const sceneTop =
        scene.getBoundingClientRect().top +
        window.scrollY -
        safeBounds.top +
        0.08 * safeH;
      const bottomLimit =
        stopObj.track.top + stopObj.box[3] * stopObj.s - safeBounds.bottom;
      if (holdRange[1] > sceneTop) {
        const adjusted = Math.max(sceneTop, bottomLimit + 0.12 * safeH);
        holdRange = [
          Math.max(bottomLimit, adjusted - Math.max(holdRange[1] - holdRange[0], 0.2 * safeH)),
          adjusted,
        ];
      }
    }
    holdIntervals.push(holdRange);
  };

  const stopElements = (Array.from(document.querySelectorAll('[data-pup-stop]')) as HTMLElement[]).filter(
    el => el.getClientRects().length
  );

  if (isMobile) {
    const laneStops = stopElements.filter(el => el.dataset.lane === 'true');
    const firstStop = laneStops[0];
    const lastStop = laneStops.length > 1 ? laneStops[laneStops.length - 1] : undefined;
    if (firstStop) processStopElement(firstStop);

    const firstScene = meta[0]?.scene ?? null;
    const scenes = (Array.from(document.querySelectorAll('#main [data-pup-scene]')) as HTMLElement[]).filter(
      s => s !== firstScene && s.getClientRects().length
    );
    const laneScale = Math.min(0.62, Math.max(0.5, clientWidth / 650));
    const peekBox = getStopBox('peek');

    scenes.forEach((sc, idx) => {
      const isLeft = idx % 2 === 0;
      const stopX = isLeft
        ? safeBounds.left + 2 - peekBox[0] * laneScale
        : safeBounds.right - 2 - peekBox[2] * laneScale;

      stops.push({
        x: stopX,
        track: { kind: 'screen', top: 0 },
        s: laneScale,
        behind: false,
        sink: SINK_OFFSET,
        box: peekBox,
      });
      meta.push({
        scene: sc,
        pose: 'peek',
        facing: isLeft ? 1 : -1,
        act: 'lane',
        looks: [],
        track: null,
      });

      const sRect = sc.getBoundingClientRect();
      const hStart = sRect.top + window.scrollY - 0.42 * clientHeight;
      const hEnd = sRect.bottom + window.scrollY - 0.58 * clientHeight;
      holdIntervals.push(
        hStart <= hEnd ? [hStart, hEnd] : [(hStart + hEnd) / 2, (hStart + hEnd) / 2]
      );
    });

    if (lastStop) processStopElement(lastStop);
  } else {
    stopElements.forEach(processStopElement);
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  const resolvedHolds = ((raw: [number, number][], minSpans: number[], maxLimit: number) => {
    const normalized: [number, number][] = raw.map(h =>
      h[0] <= h[1] ? [h[0], h[1]] : [(h[0] + h[1]) / 2, (h[0] + h[1]) / 2]
    );
    if (!normalized.length) return normalized;
    normalized[0][0] = -Infinity;
    const last = normalized[normalized.length - 1];
    last[1] = Infinity;
    last[0] = Math.min(last[0], maxLimit - 1);

    for (let i = 0; i < normalized.length - 1; i++) {
      const curr = normalized[i];
      const next = normalized[i + 1];
      if (next[0] < curr[1]) {
        const mid = (curr[1] + next[0]) / 2;
        curr[1] = Math.max(curr[0], mid);
        next[0] = Math.min(next[1], mid);
        if (next[0] < curr[1]) next[0] = curr[1];
      }
      let needed = (minSpans[i] ?? 0) - (next[0] - curr[1]);
      if (needed > 0) {
        const pullCurr = Math.min(needed / 2, curr[1] - curr[0]);
        const pushNext = Math.min(needed / 2, next[1] - next[0]);
        curr[1] -= pullCurr;
        next[0] += pushNext;
        needed -= pullCurr + pushNext;
        const extraPush = Math.min(needed, next[1] - next[0]);
        next[0] += extraPush;
        needed -= extraPush;
        if (needed > 0) {
          curr[1] -= Math.min(needed, curr[1] - curr[0]);
        }
      }
    }
    for (const h of normalized) {
      if (h[1] < h[0]) h[1] = h[0];
    }
    return normalized;
  })(
    holdIntervals,
    stops.slice(1).map((curr, idx) => {
      const prev = stops[idx];
      const spanRef = (SCALE_DESKTOP[1] - SCALE_DESKTOP[0]) * clientHeight;
      const minFraction = (isMobile ? 0.32 : 0.5) * clientHeight;
      return Math.min(
        1.4 * clientHeight,
        Math.max(
          minFraction,
          1.15 *
            Math.hypot(
              Math.abs(curr.x + ANCHOR_D.x * curr.s - (prev.x + ANCHOR_D.x * prev.s)),
              spanRef
            )
        )
      );
    }),
    maxScroll
  );

  return {
    lane: isMobile,
    stops,
    meta,
    holds: resolvedHolds,
    blend: 0.12 * clientHeight,
    mainTop: mainEl ? mainEl.getBoundingClientRect().top + window.scrollY : 0,
  };
}

function evaluateStep(
  journey: Journey,
  scrollTarget: number
): EvaluatedStep {
  const getWhatsAppTop = (): number => {
    const bar = document.querySelector('[data-whatsapp-bar]');
    const r = bar?.getClientRects().length ? bar.getBoundingClientRect() : null;
    return r && r.height ? r.top : window.innerHeight - 6;
  };

  if (journey.lane) {
    const wTop = getWhatsAppTop();
    for (const stop of journey.stops) {
      if (stop.track.kind === 'screen') {
        stop.track.top = wTop - 159 * stop.s;
      }
    }
  }

  const clientW = document.documentElement.clientWidth;
  const headerH = (document.getElementById('site-header')?.offsetHeight ?? 76) + 10;
  const safe: SafeBounds = journey.lane
    ? { left: 10, top: headerH, right: clientW - 10, bottom: getWhatsAppTop() + 40 }
    : {
        left: 10,
        top: headerH,
        right: clientW - 10,
        bottom:
          Math.min(
            window.innerHeight,
            document.querySelector('[data-whatsapp-bar]')?.getClientRects().length
              ? document.querySelector('[data-whatsapp-bar]')!.getBoundingClientRect().top
              : window.innerHeight
          ) - 10,
      };

  const { k, t } = findHoldSegment(journey.holds, scrollTarget);
  const stops = journey.stops;

  if (t <= 0 || k >= stops.length - 1) {
    const stop = stops[k];
    const pt = getStopPoint(stop, scrollTarget);
    const clamped = clampToSafe(pt.x, pt.y, stop.s, stop.box, safe);
    return {
      x: clamped.x,
      y: clamped.y,
      s: stop.s,
      front: !stop.behind,
      airborne: false,
      k,
      t: 0,
      walked: 0,
    };
  }

  const s0 = stops[k];
  const s1 = stops[k + 1];
  const hold0End = journey.holds[k][1];
  const hold1Start = journey.holds[k + 1][0];
  const travelDist = Math.max(1, hold1Start - hold0End);
  const normalizedT = clamp01((scrollTarget - hold0End) / travelDist);

  const p0 = getStopPoint(s0, hold0End);
  const p1 = getStopPoint(s1, hold1Start);

  const bezierParams = ((startPt: Point, endPt: Point, bounds: SafeBounds) => {
    const dx = endPt.x - startPt.x;
    const safeW = bounds.right - bounds.left;
    const tangentLen = Math.max(0.45 * Math.abs(dx), 0);
    const dir = dx >= 0 ? 1 : -1;
    let c1: Point = { x: startPt.x + dir * tangentLen, y: startPt.y };
    let c2: Point = { x: endPt.x - dir * tangentLen, y: endPt.y };
    const minSpan = 0.14 * safeW;

    if (Math.abs(dx) < minSpan) {
      const midX = (startPt.x + endPt.x) / 2;
      const centerDist = midX < (bounds.left + bounds.right) / 2 ? 1 : -1;
      const extraX = centerDist * (minSpan - Math.abs(dx)) * 0.9;
      c1 = { x: c1.x + extraX, y: lerp(startPt.y, endPt.y, 0.2) };
      c2 = { x: c2.x + extraX, y: lerp(startPt.y, endPt.y, 0.8) };
    }

    const clampPt = (pt: Point) => ({
      x: Math.min(bounds.right, Math.max(bounds.left, pt.x)),
      y: Math.min(bounds.bottom, Math.max(bounds.top, pt.y)),
    });
    return { p0: startPt, c1: clampPt(c1), c2: clampPt(c2), p1: endPt };
  })(
    { x: p0.x, y: p0.y - s0.sink * s0.s },
    { x: p1.x, y: p1.y - s1.sink * s1.s },
    safe
  );

  const easedProgress =
    normalizedT *
    normalizedT *
    normalizedT *
    (normalizedT * (6 * normalizedT - 15) + 10);
  const curvePos = evalCubicBezier(
    bezierParams.p0,
    bezierParams.c1,
    bezierParams.c2,
    bezierParams.p1,
    easedProgress
  );

  const scaleProgress = smoothstep(clamp01(normalizedT / 0.65));
  const currentScale = lerp(s0.s, s1.s, scaleProgress);

  const blendFraction = Math.min(0.3, Math.max(0.06, journey.blend / travelDist));
  const blendStart = 1 - smoothBetween(0, blendFraction, normalizedT);
  const blendEnd = smoothBetween(1 - blendFraction, 1, normalizedT);

  let currentY =
    curvePos.y +
    blendStart * (getStopPoint(s0, scrollTarget).y - p0.y) +
    blendEnd * (getStopPoint(s1, scrollTarget).y - p1.y);
  const currentX = curvePos.x;

  currentY +=
    s0.sink * s0.s * (1 - smoothBetween(0, 0.22, normalizedT)) +
    s1.sink * s1.s * smoothBetween(0.78, 1, normalizedT);

  let isAirborne = false;
  if (s0.behind && normalizedT < 0.36) {
    currentY -=
      Math.sin((normalizedT / 0.36) * Math.PI) * Math.min(64 * s0.s, 72);
    isAirborne = normalizedT < 0.32;
  }
  if (s1.behind && normalizedT > 0.68) {
    currentY -=
      Math.sin(((normalizedT - 0.68) / 0.32) * Math.PI) * Math.min(56 * s1.s, 60);
    isAirborne = true;
  }
  if (s0.sink && normalizedT < 0.2) isAirborne = true;

  const isFront = !(
    (s0.behind && normalizedT < 0.12) ||
    (s1.behind && normalizedT > 0.92)
  );

  const interpBox =
    normalizedT < 0.5
      ? lerpBox(
          s0.box,
          DEFAULT_BOX,
          smoothBetween(0, s0.sink ? 0.22 : s0.behind ? 0.36 : 0.06, normalizedT)
        )
      : lerpBox(
          DEFAULT_BOX,
          s1.box,
          smoothBetween(s1.sink ? 0.78 : s1.behind ? 0.68 : 0.94, 1, normalizedT)
        );

  const clamped = clampToSafe(currentX, currentY, currentScale, interpBox, safe);

  let walkedDistance = 0;
  let lastCurvePt = bezierParams.p0;
  const curveSubdivisions = Math.max(1, Math.ceil(32 * clamp01(normalizedT)));
  for (let step = 1; step <= curveSubdivisions; step++) {
    const curStepPt = evalCubicBezier(
      bezierParams.p0,
      bezierParams.c1,
      bezierParams.c2,
      bezierParams.p1,
      (step / curveSubdivisions) * clamp01(normalizedT)
    );
    walkedDistance += Math.hypot(curStepPt.x - lastCurvePt.x, curStepPt.y - lastCurvePt.y);
    lastCurvePt = curStepPt;
  }

  return {
    x: clamped.x,
    y: clamped.y,
    s: currentScale,
    front: isFront,
    airborne: isAirborne,
    k,
    t: normalizedT,
    walked: walkedDistance,
  };
}

export function PupActor() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') return;

    let resizeTimer: NodeJS.Timeout | undefined;
    let rafId: number;

    const layer = document.querySelector('.pup-layer') as HTMLDivElement | null;
    const actor = document.querySelector('.pup-actor') as HTMLDivElement | null;
    const body = document.querySelector('.pup-actor__body') as HTMLDivElement | null;
    const bubble = document.querySelector('.pup-bubble') as HTMLSpanElement | null;
    const bubbleAt = document.querySelector('.pup-bubble-at') as HTMLSpanElement | null;
    const prints = document.querySelector('.pup-prints') as HTMLDivElement | null;
    const probe = document.querySelector('.pup-probe') as HTMLDivElement | null;
    if (!layer || !actor || !body || !bubble || !bubbleAt || !prints || !probe) return;

    const svg = body.querySelector('svg');
    if (!svg) return;

    const rootDoc = document.documentElement;
    let journey: Journey | null = null;
    let puppet: Puppet | null = null;
    let isInitialized = false;
    const pawSVGs = Array.from(prints.children) as HTMLElement[];
    let pawIndex = 0;
    let bubbleHideTime = 0;

    const showBubble = (text: string, nowSec: number, duration: number = 1.4) => {
      bubble.textContent = text;
      bubble.dataset.show = 'true';
      bubbleHideTime = nowSec + duration;
    };

    let pointerTarget: { x: number; y: number; t: number } | null = null;
    let lookTarget: { el: HTMLElement; until: number } | null = null;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        pointerTarget = { x: e.clientX, y: e.clientY, t: performance.now() / 1000 };
      }
    };

    const onPupCue = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const activeMeta = activeStopIndex >= 0 ? journey?.meta[activeStopIndex] : null;
      if (!activeMeta || (detail.look && !activeMeta.scene?.contains(detail.look))) return;
      const now = performance.now() / 1000;
      if (detail.look) {
        lookTarget = { el: detail.look, until: now + (detail.secs ?? 1.6) };
      }
      if (detail.say) {
        showBubble(detail.say, now);
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        target.matches('a, button, input, textarea, select, summary')
      ) {
        lookTarget = { el: target, until: performance.now() / 1000 + 1.4 };
      }
    };

    let lastFrameTime = performance.now() / 1000;
    let lastScroll = window.scrollY;
    let lastPos: Point | null = null;
    let lastEvaluatedStep: EvaluatedStep | null = null;
    const inertiaOffset = { x: 0, y: 0, s: 0 };
    let stationaryTime = 0;
    let activeStopIndex = -1;
    let stopArrivalTime = 0;
    let lastInteractionTime = 0;
    let actionQueue: QueuedAction[] = [];
    let lookCycleTime = 0;
    let lookIndex = -1;
    let prevTreadmillX: number | null = null;
    let treadmillStationaryTime = 0;
    let lastTrackStopIndex = -1;
    let lastPawStepIndex = 0;
    let lastScrollMoveTime = performance.now() / 1000;
    let scrollDirection = 1;
    let isSnapping = false;
    let screenLanePos: Point | null = null;
    let lastWhatsAppTop = 0;
    let laneWalkAccumulator = 0;
    let layerOffsetTop = 0;
    let nextBasketIdle = 0;

    const tick = () => {
      if (!journey || !puppet) return;

      const now = performance.now() / 1000;
      const dt = Math.min(0.05, now - lastFrameTime);
      lastFrameTime = now;

      const currentScroll = window.scrollY;
      const scrollDelta = currentScroll - lastScroll;
      lastScroll = currentScroll;
      if (Math.abs(scrollDelta) > 0.5) {
        lastScrollMoveTime = now;
        scrollDirection = scrollDelta > 0 ? 1 : -1;
      }

      while (actionQueue.length && actionQueue[0][0] <= now) {
        const item = actionQueue.shift()!;
        item[1](now);
      }

      const effectiveScroll =
        now - lastScrollMoveTime > 0.25
          ? ((j: Journey, sY: number): number => {
              const { k, t } = findHoldSegment(j.holds, sY);
              if (t <= 0 || k >= j.stops.length - 1) return sY;
              const s0 = j.stops[k];
              const s1 = j.stops[k + 1];
              const minT = s0.sink ? 0.22 : 0.36 * +s0.behind;
              const maxT = s1.sink ? 0.78 : s1.behind ? 0.68 : 1;
              let targetT = t;
              if (t < minT) targetT = t < minT / 2 ? 0 : minT;
              else if (t > maxT) targetT = t > (1 + maxT) / 2 ? 1 : maxT;
              return targetT === t
                ? sY
                : j.holds[k][1] + targetT * (j.holds[k + 1][0] - j.holds[k][1]);
            })(journey, currentScroll)
          : currentScroll;

      const step = evaluateStep(journey, effectiveScroll);

      const isScreenLane =
        journey.lane &&
        journey.stops[step.k]?.track.kind === 'screen' &&
        (step.t > 0
          ? journey.stops[step.k + 1]?.track.kind === 'screen'
          : true);

      const decay = Math.exp(-dt / 0.28);
      inertiaOffset.x *= decay;
      inertiaOffset.y *= decay;
      inertiaOffset.s *= decay;
      if (Math.abs(inertiaOffset.x) < 0.05 && Math.abs(inertiaOffset.y) < 0.05) {
        inertiaOffset.x = inertiaOffset.y = 0;
      }

      const isSnappingNow = effectiveScroll !== currentScroll;
      if (isSnappingNow !== isSnapping && lastPos && !isScreenLane) {
        inertiaOffset.x = lastPos.x - step.x;
        inertiaOffset.y = lastPos.y - step.y;
      }
      isSnapping = isSnappingNow;

      const finalScale = step.s + inertiaOffset.s;
      let finalX = step.x + inertiaOffset.x;
      let finalY = step.y + inertiaOffset.y;
      const whatsAppBarTop = journey.lane
        ? (() => {
            const b = document.querySelector('[data-whatsapp-bar]');
            const r = b?.getClientRects().length ? b.getBoundingClientRect() : null;
            return r && r.height ? r.top : window.innerHeight - 6;
          })()
        : 0;

      let isAligned = true;
      if (isScreenLane) {
        if (!screenLanePos) {
          screenLanePos = lastPos
            ? { x: lastPos.x, y: lastPos.y - lastWhatsAppTop }
            : { x: finalX, y: finalY - whatsAppBarTop };
        }
        const smoothFactor = 1 - Math.exp(-dt / 0.14);
        screenLanePos.x += (finalX - screenLanePos.x) * smoothFactor;
        screenLanePos.y += (finalY - whatsAppBarTop - screenLanePos.y) * smoothFactor;
        isAligned = Math.hypot(finalX - screenLanePos.x, finalY - whatsAppBarTop - screenLanePos.y) < 1.5;
        finalX = screenLanePos.x;
        finalY = whatsAppBarTop + screenLanePos.y;
      } else if (screenLanePos) {
        inertiaOffset.x = (lastPos?.x ?? finalX) - step.x;
        inertiaOffset.y = (lastPos?.y ?? finalY) - step.y;
        finalX = step.x + inertiaOffset.x;
        finalY = step.y + inertiaOffset.y;
        screenLanePos = null;
      }

      lastWhatsAppTop = whatsAppBarTop;
      lastEvaluatedStep = { ...step, x: finalX, y: finalY, s: finalScale };

      setDataset(layer, 'anchor', isScreenLane ? 'bottom' : 'top');
      layerOffsetTop = isScreenLane ? layer.getBoundingClientRect().top : 0;

      const isHolding = step.t === 0 && isAligned;
      const currentStopIndex = step.k;

      if (isHolding) {
        if (activeStopIndex !== currentStopIndex) {
          const stopMeta = journey.meta[currentStopIndex];
          actionQueue = [];
          lookTarget = null;
          activeStopIndex = currentStopIndex;
          stopArrivalTime = now;
          lastInteractionTime = now;
          prevTreadmillX = null;
          puppet.reset();
          puppet.setPose(stopMeta.pose);
          puppet.face(stopMeta.facing, 0.14);
          puppet.stride(0);
          puppet.wag(stopMeta.act === 'basket' ? 0.3 : 0.7);
          puppet.jolt(0.4);
          nextBasketIdle = now + 2.4;
        }

        const currentMeta = journey.meta[currentStopIndex];

        if (currentMeta.track && !actionQueue.length) {
          const treadmillLeft = currentMeta.track.getBoundingClientRect().left;
          const deltaX = prevTreadmillX === null ? 0 : treadmillLeft - prevTreadmillX;
          prevTreadmillX = treadmillLeft;
          puppet.walkedTo(-treadmillLeft / finalScale);
          if (Math.abs(deltaX) > 0.15) {
            treadmillStationaryTime = 0;
            puppet.setPose('walk');
            puppet.stride(1);
            puppet.face(deltaX < 0 ? 1 : -1, 0.16);
          } else if ((treadmillStationaryTime += dt) > 0.25) {
            puppet.setPose('stand');
            puppet.stride(0);
          }
        }

        if (
          currentMeta.act === 'tilt' &&
          !actionQueue.length &&
          now - stopArrivalTime > 1.2
        ) {
          const sinOsc = Math.sin(0.9 * now);
          puppet.cock(sinOsc > 0.35 ? 13 : sinOsc < -0.35 ? -10 : 0);
        }

        if (
          currentMeta.act === 'basket' &&
          !actionQueue.length &&
          now > nextBasketIdle
        ) {
          nextBasketIdle = now + 4.5 + 3 * Math.random();
          if (Math.random() < 0.7) {
            puppet.jolt(0.55);
          } else {
            puppet.yawn(now, 0.7);
          }
        }

        const hasActiveFocus =
          (lookTarget && lookTarget.until > now) ||
          (pointerTarget && now - pointerTarget.t < 2.5);

        if (
          currentMeta.looks.length &&
          !hasActiveFocus &&
          now - stopArrivalTime > 0.8 &&
          now - lookCycleTime > 1.7
        ) {
          lookCycleTime = now;
          lookIndex = (lookIndex + 1) % (currentMeta.looks.length + 1);
          if (lookIndex < currentMeta.looks.length) {
            lookTarget = { el: currentMeta.looks[lookIndex], until: now + 1.4 };
          }
        }

        if (Math.abs(scrollDelta) > 0.5) {
          lastInteractionTime = now;
        }

        if (
          !actionQueue.length &&
          !currentMeta.track &&
          currentMeta.act !== 'basket' &&
          now - lastInteractionTime > 9
        ) {
          lastInteractionTime = now;
          actionQueue =
            Math.random() < 0.55
              ? PUPPET_MOTIONS.tilt(
                  {
                    d: puppet,
                    rest: POSES[currentMeta.pose],
                    facing: currentMeta.facing,
                    say: (txt, dur) => showBubble(txt, performance.now() / 1000, dur),
                    hearts: () => {},
                  },
                  now
                )
              : [
                  [now, () => puppet!.wag(1)],
                  [now + 2.4, () => puppet!.wag(0.7)],
                ];
        }
      } else {
        if (activeStopIndex !== -1) {
          activeStopIndex = -1;
          actionQueue = [];
          puppet.reset();
        }

        const deltaDist = lastPos
          ? Math.hypot(finalX - lastPos.x, finalY - lastPos.y)
          : 0;
        stationaryTime = deltaDist > 0.25 ? 0 : stationaryTime + dt;

        let isAirbornePose = step.airborne;
        if (journey.lane && step.t > 0) {
          const curS = journey.stops[currentStopIndex];
          const nextS = journey.stops[currentStopIndex + 1];
          if (curS.sink && step.t < 0.22) isAirbornePose = scrollDirection > 0;
          else if (nextS?.sink && step.t > 0.78)
            isAirbornePose = scrollDirection < 0;
        }

        if (isAirbornePose) {
          puppet.setPose('hop');
          puppet.stride(0);
        } else if (stationaryTime > 0.3) {
          puppet.setPose('stand');
          puppet.stride(0);
          if (stationaryTime > 2.6 && stationaryTime - dt <= 2.6) {
            showBubble('coming?', now);
          }
        } else {
          puppet.setPose('walk');
          puppet.stride(1);
        }

        puppet.walkedTo(
          (isScreenLane ? (laneWalkAccumulator += deltaDist) : step.walked) /
            Math.max(0.05, finalScale)
        );

        if (lastPos) {
          const moveDx = finalX - lastPos.x;
          if (
            Math.abs(moveDx) > 0.6 &&
            Math.abs(moveDx) > 0.35 * Math.abs(finalY - lastPos.y)
          ) {
            puppet.face(moveDx > 0 ? 1 : -1, 0.16);
          }
        }

        if (!journey.lane) {
          const stepCount = Math.floor(step.walked / (34 * finalScale));
          if (
            lastTrackStopIndex === currentStopIndex &&
            stepCount !== lastPawStepIndex &&
            !step.airborne &&
            lastPos
          ) {
            const isLeftPaw = (stepCount & 1) === 1;
            const legOffsetX = isLeftPaw ? 186 : 110;
            const baseX = finalX - ANCHOR_D.x * finalScale;
            const baseY = finalY - ANCHOR_D.y * finalScale;
            const pawX =
              baseX +
              (puppet.facingDir > 0 ? legOffsetX : PUPPET_WIDTH - legOffsetX) *
                finalScale;
            const pawY =
              baseY +
              226 * finalScale +
              currentScroll -
              journey.mainTop +
              (isLeftPaw ? -4 : 4) * finalScale;

            const pawAngle =
              Math.atan2(finalY - lastPos.y + scrollDelta, finalX - lastPos.x) +
              Math.PI / 2;
            const pawSize = 14 * Math.max(0.75, 1.5 * finalScale);
            const pawSvg = pawSVGs[pawIndex++ % pawSVGs.length];

            pawSvg.style.transform = `translate(${(pawX - pawSize / 2).toFixed(
              1
            )}px, ${(pawY - pawSize / 2).toFixed(1)}px) rotate(${pawAngle.toFixed(
              3
            )}rad)`;
            pawSvg.style.width = pawSvg.style.height = `${pawSize.toFixed(1)}px`;
            pawSvg.animate(
              [
                { opacity: 0 },
                { opacity: 0.45, offset: 0.08 },
                { opacity: 0.45, offset: 0.5 },
                { opacity: 0 },
              ],
              { duration: 2600, easing: 'ease-out' }
            );
          }
          lastTrackStopIndex = currentStopIndex;
          lastPawStepIndex = stepCount;
        }
      }

      lastPos = { x: finalX, y: finalY };

      journey.meta.forEach((metaItem, idx) => {
        if (metaItem.scene) {
          setDataset(
            metaItem.scene,
            'here',
            String(isHolding && idx === currentStopIndex)
          );
          setDataset(
            metaItem.scene,
            'visited',
            String(
              idx <= currentStopIndex ||
                (idx === currentStopIndex + 1 && step.t > 0.92)
            )
          );
        }
      });

      if (lookTarget && lookTarget.until > now) {
        const r = lookTarget.el.getBoundingClientRect();
        puppet.lookAt({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      } else if (pointerTarget && now - pointerTarget.t < 2.5) {
        puppet.lookAt(pointerTarget);
      } else {
        puppet.lookAt(null);
      }

      actor.style.transform = `translate3d(${(
        finalX -
        ANCHOR_D.x * finalScale
      ).toFixed(2)}px, ${(
        finalY -
        ANCHOR_D.y * finalScale -
        layerOffsetTop
      ).toFixed(2)}px, 0)`;
      body.style.transform = `scale(${finalScale.toFixed(4)})`;

      setDataset(layer, 'front', String(step.front));
      setDataset(actor, 'holding', String(isHolding));

      if (bubble.dataset.show === 'true') {
        if (now > bubbleHideTime) {
          bubble.dataset.show = 'false';
        }
        const bubbleX =
          (puppet.facingDir > 0 ? 214 : PUPPET_WIDTH - 214) * finalScale;
        bubbleAt.style.transform = `translate(${bubbleX.toFixed(1)}px, ${(
          30 * finalScale
        ).toFixed(1)}px)`;
      }

      puppet.tick(dt, now);
      rafId = requestAnimationFrame(tick);
    };

    let rapidClicks = 0;
    let lastClickTime = 0;
    let lastTrickPlayed: string | null = null;

    const onActorClick = () => {
      if (!puppet || !journey) return;
      const now = performance.now() / 1000;
      rapidClicks = now - lastClickTime < 0.7 ? rapidClicks + 1 : 1;
      lastClickTime = now;
      lastInteractionTime = now;

      if (activeStopIndex < 0) {
        const metaItem = journey.meta[Math.max(0, lastEvaluatedStep?.k ?? 0)];
        const trickName =
          RANDOM_TRICKS[Math.floor(Math.random() * RANDOM_TRICKS.length)];
        lastTrickPlayed = trickName;
        const ctx = {
          d: puppet,
          rest: POSES[metaItem.pose],
          facing: metaItem.facing,
          say: (txt: string, dur?: number) => showBubble(txt, performance.now() / 1000, dur),
          hearts: () => {
            if (lastEvaluatedStep) {
              emitHearts(
                layer,
                lastEvaluatedStep.x -
                  ANCHOR_D.x * lastEvaluatedStep.s +
                  (puppet!.facingDir > 0 ? 212 : PUPPET_WIDTH - 212) *
                    lastEvaluatedStep.s,
                lastEvaluatedStep.y -
                  (ANCHOR_D.y - 40) * lastEvaluatedStep.s -
                  layerOffsetTop
              );
            }
          },
        };

        if (trickName === 'jump') {
          actionQueue = [
            [now, () => { puppet!.hop(1.35); ctx.say('wheee!'); }],
            [now + 0.5, () => puppet!.hop(0.7)],
          ];
        } else if (trickName === 'woof') {
          actionQueue = [
            [now, t => { puppet!.woof(t); ctx.say('woof!'); }],
            [now + 0.4, t => puppet!.woof(t)],
          ];
        } else if (trickName === 'love') {
          actionQueue = [
            [
              now,
              () => {
                puppet!.wag(1);
                puppet!.hop(0.5);
                ctx.hearts();
                ctx.say('I like you!');
              },
            ],
          ];
        } else {
          actionQueue = [
            [
              now,
              t => {
                puppet!.jolt(1.4);
                puppet!.hop(0.4);
                puppet!.yawn(t, 0.22);
                ctx.say('achoo!');
              },
            ],
          ];
        }
        return;
      }

      const activeMeta = journey.meta[activeStopIndex];
      let chosenTrick: string;
      if (activeMeta.track) {
        const set = ['woof', 'hop', 'love'];
        chosenTrick = set[Math.floor(Math.random() * set.length)];
      } else if (activeMeta.act === 'basket') {
        const set = ['tilt', 'love', 'sneeze', 'woof'];
        chosenTrick = set[Math.floor(Math.random() * set.length)];
      } else if (activeMeta.pose === 'peek') {
        const set = ['peekaboo', 'woof', 'tilt', 'sneeze'];
        chosenTrick = set[Math.floor(Math.random() * set.length)];
      } else {
        chosenTrick = pickTrick(lastTrickPlayed, rapidClicks);
        if (chosenTrick === 'zoomies') chosenTrick = 'spin';
      }

      if (chosenTrick === 'peekaboo' && actionQueue.length) return;
      lastTrickPlayed = chosenTrick;
      puppet.reset();
      actionQueue = PUPPET_MOTIONS[chosenTrick](
        {
          d: puppet,
          rest: POSES[activeMeta.pose],
          facing: activeMeta.facing,
          say: (txt, dur) => showBubble(txt, performance.now() / 1000, dur),
          hearts: () => {
            if (lastEvaluatedStep) {
              emitHearts(
                layer,
                lastEvaluatedStep.x -
                  ANCHOR_D.x * lastEvaluatedStep.s +
                  (puppet!.facingDir > 0 ? 212 : PUPPET_WIDTH - 212) *
                    lastEvaluatedStep.s,
                lastEvaluatedStep.y -
                  (ANCHOR_D.y - 40) * lastEvaluatedStep.s -
                  layerOffsetTop
              );
            }
          },
        },
        now
      );
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && puppet && activeStopIndex >= 0) {
        puppet.petting(true);
        puppet.wag(1);
      }
    };

    const onPointerLeave = () => {
      if (puppet) {
        puppet.petting(false);
        if (activeStopIndex >= 0) {
          puppet.wag(journey?.meta[activeStopIndex]?.act === 'basket' ? 0.3 : 0.7);
        }
      }
    };

    const startJourney = () => {
      if (isInitialized) return;
      const j = computeJourney(probe);
      if (j.stops.length < 2) return;
      journey = j;
      isInitialized = true;
      rootDoc.dataset.pup = j.lane ? 'lane' : 'live';
      layer.hidden = false;

      const firstMeta = j.meta[0];
      puppet = new Puppet(svg, firstMeta.pose, firstMeta.facing);
      lastScroll = window.scrollY;
      lastPos = null;
      lastScrollMoveTime = lastFrameTime = performance.now() / 1000;
      isSnapping = false;
      screenLanePos = null;

      const initStep = evaluateStep(j, window.scrollY);
      if (
        initStep.k === 0 &&
        initStep.t === 0 &&
        firstMeta.act === 'peekaboo'
      ) {
        activeStopIndex = 0;
        stopArrivalTime = lastFrameTime;
        const peekDownPose = { ...POSES.peek, headY: 120 };
        const friends = firstMeta.scene
          ? (Array.from(firstMeta.scene.querySelectorAll('[data-pup-friend]')) as HTMLElement[])
          : [];
        const friendFirst = friends[0];
        const friendLast = friends[friends.length - 1];

        actionQueue = [
          [lastFrameTime + 0.1, () => puppet!.setPose(peekDownPose)],
          [
            lastFrameTime + 0.7,
            t => {
              puppet!.setPose('peek');
              puppet!.jolt(1.2);
              showBubble('peekaboo!', t, 1.6);
            },
          ],
          [
            lastFrameTime + 1.5,
            t => friendFirst && (lookTarget = { el: friendFirst, until: t + 0.8 }),
          ],
          [
            lastFrameTime + 2.3,
            t => friendLast && (lookTarget = { el: friendLast, until: t + 0.8 }),
          ],
          [
            lastFrameTime + 3.1,
            () => {
              lookTarget = null;
              puppet!.wag(1);
            },
          ],
        ];
      } else {
        activeStopIndex = -1;
      }

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pup:cue', onPupCue);
      window.addEventListener('focusin', onFocusIn);
      actor.addEventListener('click', onActorClick);
      actor.addEventListener('pointerenter', onPointerEnter);
      actor.addEventListener('pointerleave', onPointerLeave);

      rafId = requestAnimationFrame(tick);
    };

    const stopJourney = () => {
      if (isInitialized) {
        isInitialized = false;
        cancelAnimationFrame(rafId);
        delete rootDoc.dataset.pup;
        layer.hidden = true;
        delete layer.dataset.anchor;
        layerOffsetTop = 0;
        journey?.meta.forEach(m => {
          if (m.scene) {
            delete m.scene.dataset.here;
            delete m.scene.dataset.visited;
          }
        });
        journey = null;
        puppet = null;
        activeStopIndex = -1;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pup:cue', onPupCue);
        window.removeEventListener('focusin', onFocusIn);
        actor.removeEventListener('click', onActorClick);
        actor.removeEventListener('pointerenter', onPointerEnter);
        actor.removeEventListener('pointerleave', onPointerLeave);
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!isInitialized || !journey) return;
        const newJourney = computeJourney(probe);
        if (newJourney.stops.length < 2) return stopJourney();

        const prevLastStep = lastEvaluatedStep;
        const laneChanged = newJourney.lane !== journey.lane;
        journey = newJourney;
        rootDoc.dataset.pup = newJourney.lane ? 'lane' : 'live';
        if (laneChanged) activeStopIndex = -1;

        if (prevLastStep) {
          const newStep = evaluateStep(newJourney, window.scrollY);
          inertiaOffset.x = prevLastStep.x - newStep.x;
          inertiaOffset.y = prevLastStep.y - newStep.y;
          inertiaOffset.s = prevLastStep.s - newStep.s;
        }
      }, 120);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.body);
    window.addEventListener('resize', handleResize);
    window.addEventListener('load', handleResize);

    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => (motionQuery.matches ? stopJourney() : startJourney());
    motionQuery.addEventListener('change', onMotionChange);

    startJourney();
    document.fonts?.ready?.then(handleResize);

    return () => {
      stopJourney();
      clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('load', handleResize);
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, [pathname]);

  return null;
}
