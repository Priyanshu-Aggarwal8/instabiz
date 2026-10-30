import {
  POSES,
  BASE_POSE,
  INITIAL_MOTION_STATE,
  PUPPET_WIDTH,
  PUPPET_HEIGHT,
  EYE_Y,
  HEAD_PIVOT,
  interpolatePose,
  evaluateFrame,
} from './puppetConstants';
import { Pose, MotionState, Point } from './types';

const PROPERTY_MAPPINGS: [string, string, string][] = [
  ['root', 'transform', 'root'],
  ['shadow', 'transform', 'shadow'],
  ['shadow', 'opacity', 'shadowOpacity'],
  ['body', 'transform', 'body'],
  ['body', 'opacity', 'side'],
  ['bf', 'transform', 'bf'],
  ['bf', 'opacity', 'backLegs'],
  ['bn', 'transform', 'bn'],
  ['bn', 'opacity', 'backLegs'],
  ['ff', 'transform', 'ff'],
  ['fn', 'transform', 'fn'],
  ['tail', 'transform', 'tail'],
  ['haunch', 'transform', 'haunch'],
  ['haunch', 'opacity', 'haunchOpacity'],
  ['head', 'transform', 'head'],
  ['earL', 'transform', 'earL'],
  ['earR', 'transform', 'earR'],
  ['eyes', 'transform', 'eyes'],
  ['open', 'opacity', 'openEyes'],
  ['blink', 'transform', 'blink'],
  ['happy', 'opacity', 'happyEyes'],
  ['shut', 'opacity', 'shutEyes'],
  ['tongue', 'opacity', 'tongue'],
  ['mouth', 'opacity', 'mouth'],
  ['ledge', 'opacity', 'ledge'],
];

const lerpExp = (dt: number, timeConstant: number): number =>
  1 - Math.exp(-dt / timeConstant);

const clamp = (val: number, min: number = -1, max: number = 1): number =>
  Math.max(min, Math.min(max, val));

export class Puppet {
  svg: SVGSVGElement;
  els = new Map<string, Element>();
  written = new Map<string, string>();
  pose: Pose;
  target: Pose;
  m: MotionState;
  facing: number;
  facingTarget: number;
  strideTarget = 0;
  wagTarget = 0.35;
  gazeTarget: Point = { x: 0, y: 0 };
  tilt = 0;
  tiltTarget = 0;
  earV = 0;
  nextBlink = 1.2;
  blinkAt = -1;
  woofUntil = 0;
  bounce = 0;
  bounceV = 0;
  offset = 0;
  offsetTarget = 0;
  pet = 0;
  petTarget = 0;
  turn = 0.07;
  lean = 0;

  constructor(svg: SVGSVGElement, poseName: string = 'sit', facing: number = 1) {
    this.svg = svg;
    this.m = { ...INITIAL_MOTION_STATE };
    this.facing = facing;
    this.facingTarget = facing;

    Array.from(svg.querySelectorAll('[data-p]')).forEach(el => {
      const p = (el as HTMLElement).dataset.p;
      if (p) this.els.set(p, el);
    });

    const initPose = POSES[poseName] ?? BASE_POSE;
    this.pose = { ...initPose };
    this.target = this.pose;
  }

  setPose(pose: string | Pose): void {
    this.target = typeof pose === 'string' ? POSES[pose] ?? BASE_POSE : pose;
  }

  jump(poseName: string, facing?: number): void {
    const p = POSES[poseName] ?? BASE_POSE;
    this.pose = { ...p };
    this.target = p;
    if (facing !== undefined) {
      this.facing = this.facingTarget = facing;
    }
  }

  face(direction: number, turnSpeed: number = 0.07): void {
    this.facingTarget = direction;
    this.turn = turnSpeed;
  }

  get facingDir(): number {
    return this.facingTarget;
  }

  stride(val: number): void {
    this.strideTarget = clamp(val, 0, 1);
  }

  advance(distance: number): void {
    this.m.phase += (distance / 46) * Math.PI;
  }

  walkedTo(totalDist: number): void {
    this.m.phase = (totalDist / 46) * Math.PI;
  }

  wag(val: number): void {
    this.wagTarget = clamp(val, 0, 1);
  }

  cock(deg: number): void {
    this.tiltTarget = deg;
  }

  lookAt(target: Point | null): void {
    if (!target) {
      this.gazeTarget = { x: 0, y: 0 };
      return;
    }
    const rect = this.svg.getBoundingClientRect();
    const pivotX = this.facingTarget > 0 ? HEAD_PIVOT[0] : PUPPET_WIDTH - HEAD_PIVOT[0];
    const eyeGlobalX = rect.left + (pivotX / PUPPET_WIDTH) * rect.width;
    const eyeGlobalY = rect.top + (EYE_Y / PUPPET_HEIGHT) * rect.height;

    const dx = target.x - eyeGlobalX;
    const dy = target.y - eyeGlobalY;
    const dist = Math.hypot(dx, dy) || 1;
    const clampedDist = Math.min(1, dist / 160);

    this.gazeTarget = {
      x: (dx / dist) * clampedDist * this.facingTarget,
      y: (dy / dist) * clampedDist,
    };
  }

  woof(timeSec: number): void {
    this.woofUntil = timeSec + 0.34;
    this.bounceV = -150;
    this.earV += 260;
  }

  jolt(factor: number = 1): void {
    this.earV += 220 * factor;
  }

  hop(factor: number = 1): void {
    this.bounceV = -230 * factor;
    this.earV += 200 * factor;
  }

  yawn(timeSec: number, duration: number = 0.9): void {
    this.woofUntil = timeSec + duration;
  }

  dash(offsetVal: number): void {
    this.offsetTarget = offsetVal;
  }

  petting(isPet: boolean): void {
    this.petTarget = isPet ? 1 : 0;
  }

  reset(): void {
    this.offsetTarget = 0;
    this.tiltTarget = 0;
    this.petTarget = 0;
  }

  tick(dt: number, timeSec: number): void {
    dt = Math.min(dt, 0.05);
    const m = this.m;
    m.time = timeSec;

    this.pose = interpolatePose(this.pose, this.target, lerpExp(dt, 0.16));
    this.facing += (this.facingTarget - this.facing) * lerpExp(dt, this.turn);

    m.stride += (this.strideTarget - m.stride) * lerpExp(dt, 0.12);
    if (m.stride < 0.012 && this.strideTarget === 0) m.stride = 0;

    m.wag += (this.wagTarget - m.wag) * lerpExp(dt, 0.4);
    m.gazeX += (this.gazeTarget.x - m.gazeX) * lerpExp(dt, 0.07);
    m.gazeY += (this.gazeTarget.y - m.gazeY) * lerpExp(dt, 0.07);

    this.tilt += (this.tiltTarget + 3 * m.gazeX - this.tilt) * lerpExp(dt, 0.18);

    // Ear spring simulation
    this.earV += (-150 * m.ear - 10 * this.earV) * dt;
    m.ear = clamp(m.ear + this.earV * dt, -28, 28);

    // Body vertical bounce spring simulation
    this.bounceV += (-260 * this.bounce - 16 * this.bounceV) * dt;
    this.bounce += this.bounceV * dt;

    // Horizontal offset spring
    const prevOffset = this.offset;
    this.offset += (this.offsetTarget - this.offset) * lerpExp(dt, 0.2);
    if (Math.abs(this.offsetTarget - this.offset) < 0.05) {
      this.offset = this.offsetTarget;
    }
    const offsetDelta = Math.abs(this.offset - prevOffset);
    if (offsetDelta) this.advance(offsetDelta);

    const offsetStride = dt > 0 ? Math.min(1, offsetDelta / dt / 180) : 0;
    this.pet += (this.petTarget - this.pet) * lerpExp(dt, 0.15);

    // Blinking
    if (timeSec > this.nextBlink && this.pose.eyes > 0.6) {
      this.blinkAt = timeSec;
      this.nextBlink = timeSec + 2.2 + 3.8 * Math.random();
      if (Math.random() < 0.18) {
        this.nextBlink = timeSec + 0.32;
      }
    }
    const blinkProgress = (timeSec - this.blinkAt) / 0.15;
    m.blink =
      blinkProgress >= 0 && blinkProgress <= 1
        ? Math.sin(blinkProgress * Math.PI)
        : 0;

    const dynamicPose: Pose = {
      ...this.pose,
      headRot: this.pose.headRot + this.tilt,
      bodyRot: this.pose.bodyRot + this.lean,
      bodyY: this.pose.bodyY + this.bounce,
      headY: this.pose.headY + 1.15 * this.bounce,
      mouth: timeSec < this.woofUntil ? 1 : this.pose.mouth,
      happy: Math.max(this.pose.happy, this.pet),
    };

    const effectiveMotion =
      offsetStride > m.stride ? { ...m, stride: offsetStride } : m;
    const frame = evaluateFrame(dynamicPose, effectiveMotion);

    const facingVal =
      Math.abs(this.facing) < 0.02
        ? 0.02 * Math.sign(this.facing || 1)
        : this.facing;

    const rootTransform = `translate(${this.offset.toFixed(
      1
    )} 0) translate(${PUPPET_WIDTH / 2} 0) scale(${facingVal.toFixed(
      3
    )} 1) translate(${-PUPPET_WIDTH / 2} 0)`;

    for (const [part, attr, prop] of PROPERTY_MAPPINGS) {
      const el = this.els.get(part);
      if (!el) continue;
      const val = prop === 'root' ? rootTransform : String(frame[prop]);
      const key = `${part}:${attr}`;
      if (this.written.get(key) !== val) {
        el.setAttribute(attr, val);
        this.written.set(key, val);
      }
    }
  }
}
