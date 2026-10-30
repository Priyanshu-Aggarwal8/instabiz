import { Pose, MotionState } from './types';

// Fluffy puff / cloud curve generator
function generatePuff(
  centerX: number,
  centerY: number,
  rx: number,
  ry: number,
  segments: number,
  bulge: number,
  startAngle: number = -Math.PI / 2,
  tiltDeg: number = 0
): string {
  const tiltRad = (tiltDeg * Math.PI) / 180;
  const pointAt = (angle: number, extraRadius: number): string => {
    const cosA = Math.cos(angle) * (rx + extraRadius);
    const sinA = Math.sin(angle) * (ry + (ry / rx) * extraRadius);
    const px = centerX + cosA * Math.cos(tiltRad) - sinA * Math.sin(tiltRad);
    const py = centerY + cosA * Math.sin(tiltRad) + sinA * Math.cos(tiltRad);
    return `${px.toFixed(1)} ${py.toFixed(1)}`;
  };

  let d = '';
  for (let i = 0; i < segments; i++) {
    const a0 = startAngle + (i / segments) * Math.PI * 2;
    const a1 = startAngle + ((i + 1) / segments) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    d += `${i === 0 ? `M${pointAt(a0, 0)}` : ''}Q${pointAt(mid, 2.1 * bulge)} ${pointAt(a1, 0)}`;
  }
  return `${d}Z`;
}

// Joint center coordinates
export const BODY_CENTER: [number, number] = [196, 206];
export const HEAD_CENTER: [number, number] = [212, 100];
export const SHOULDER_NEAR: [number, number] = [186, 194];
export const SHOULDER_FAR: [number, number] = [168, 192];
export const HIP_NEAR: [number, number] = [110, 194];
export const HIP_FAR: [number, number] = [94, 192];
export const TAIL_BASE: [number, number] = [84, 150];
export const EAR_L_BASE: [number, number] = [174, 82];
export const EAR_R_BASE: [number, number] = [250, 82];

// Colors
export const COLOR_STROKE = '#2a170e';
export const COLOR_BODY = '#f2be6b';
export const COLOR_FAR_SHADOW = '#e4a352';
export const COLOR_MUZZLE = '#fbe3b4';
export const COLOR_BLUSH = '#f9b9a6';
export const COLOR_COLLAR = '#a24a1a';

// Canvas bounds
export const PUPPET_WIDTH = 300;
export const PUPPET_HEIGHT = 240;
export const GROUND_Y = 228;
export const EYE_Y = 98;
export const HEAD_PIVOT: [number, number] = [212, 100];

// SVG Paths
export const PUP_PATHS = {
  body: generatePuff(140, 170, 64, 36, 15, 3.4, 0.95 * Math.PI),
  chest: generatePuff(192, 166, 30, 32, 9, 3.2, 0.6 * Math.PI),
  tail: generatePuff(70, 126, 17, 16, 9, 3.2),
  tailStem: 'M86 152 C80 146 76 140 74 136',
  haunch: generatePuff(110, 204, 30, 24, 10, 3.2, Math.PI),
  haunchPaw:
    'M112 214 C126 212 142 214 146 221 C148 226 144 229 136 229 L116 229 C108 229 104 224 106 219 Z',
  head: generatePuff(212, 100, 51, 46, 16, 3.6),
  topknot: generatePuff(212, 52, 17, 12, 8, 2.9, Math.PI),
  earL: generatePuff(170, 112, 19, 34, 10, 3.2, -Math.PI / 2, 12),
  earR: generatePuff(254, 112, 19, 34, 10, 3.2, -Math.PI / 2, -12),
  muzzle:
    'M188 120 C188 106 200 100 212 100 C224 100 236 106 236 120 C236 133 225 140 212 140 C199 140 188 133 188 120 Z',
  nose:
    'M204.5 111.5 Q212 107.2 219.5 111.5 Q218.2 118.4 212 120 Q205.8 118.4 204.5 111.5 Z',
  mouth:
    'M212 120 V124.5 M212 124.5 Q207.2 129.6 202.8 125.2 M212 124.5 Q216.8 129.6 221.2 125.2',
  mouthOpen:
    'M203 126 Q212 122 221 126 Q219 138 212 139 Q205 138 203 126 Z',
  tongue: 'M207.6 127.4 Q212 136.6 216.4 127.4 Z',
  collar: 'M178 146 Q212 162 246 146 L246 154 Q212 170 178 154 Z',
  tag:
    'M212 160 C212 156 206 155 206 159.4 C206 163 212 166.6 212 168.4 C212 166.6 218 163 218 159.4 C218 155 212 156 212 160 Z',
  ledgePaws:
    'M175 159 C175 148 181 142 190 142 C199 142 205 148 205 159 Z M219 159 C219 148 225 142 234 142 C243 142 249 148 249 159 Z',
  ledgeToes: 'M186 153 v-4.5 M194 153 v-4.5 M230 153 v-4.5 M238 153 v-4.5',
  shadow: { cx: 150, cy: 230, rx: 92, ry: 7 },
};

function generateLeg(width: number, length: number): string {
  const halfW = width / 2;
  return `M${-halfW} -14 C${-halfW} 4 -12 ${length - 18} -12 ${length - 9} C-12 ${
    length - 2
  } -7 ${length} 0 ${length} C9 ${length} 13 ${length - 3} 13 ${length - 9} C13 ${
    length - 18
  } ${halfW} 4 ${halfW} -14`;
}

export const PUP_LEGS = {
  front: generateLeg(24, 228 - SHOULDER_NEAR[1]),
  frontFar: generateLeg(22, 228 - SHOULDER_FAR[1]),
  back: generateLeg(30, 228 - HIP_NEAR[1]),
  backFar: generateLeg(28, 228 - HIP_FAR[1]),
};

export const BASE_POSE: Pose = {
  bodyRot: 0,
  bodyX: 0,
  bodyY: 0,
  stretch: 1,
  headX: 0,
  headY: 0,
  headRot: 0,
  earL: 0,
  earR: 0,
  tail: 0,
  fn: 0,
  ff: 0,
  bn: 0,
  bf: 0,
  sit: 0,
  eyes: 1,
  happy: 0,
  tongue: 0,
  mouth: 0,
  front: 0,
};

export const POSES: Record<string, Pose> = {
  stand: BASE_POSE,
  walk: { ...BASE_POSE, tail: -6, tongue: 1 },
  sit: {
    ...BASE_POSE,
    bodyRot: -24,
    bodyY: -2,
    headX: -10,
    headY: -6,
    tail: 34,
    sit: 1,
    tongue: 1,
  },
  peek: {
    ...BASE_POSE,
    headY: 4,
    earL: -6,
    earR: 6,
    tail: -20,
    front: 1,
    tongue: 1,
  },
  snug: {
    ...BASE_POSE,
    headY: 9,
    headRot: 4,
    earL: 3,
    earR: -3,
    tail: -20,
    front: 1,
    tongue: 0,
  },
  lie: {
    ...BASE_POSE,
    bodyRot: -5,
    bodyY: 22,
    headX: 12,
    headY: 40,
    headRot: 3,
    fn: -84,
    ff: -80,
    sit: 1,
    tail: 58,
    tongue: 0,
  },
  sleep: {
    ...BASE_POSE,
    bodyRot: -5,
    bodyY: 22,
    headX: 14,
    headY: 44,
    headRot: -8,
    fn: -84,
    ff: -80,
    sit: 1,
    tail: 64,
    eyes: 0,
    earL: 4,
    earR: -4,
  },
  settle: {
    ...BASE_POSE,
    bodyRot: -5,
    bodyY: 22,
    headX: 10,
    headY: 16,
    fn: -84,
    ff: -80,
    sit: 1,
    tail: 40,
    tongue: 1,
  },
  hop: {
    ...BASE_POSE,
    bodyRot: -9,
    stretch: 1.06,
    headY: -6,
    fn: -42,
    ff: -32,
    bn: 40,
    bf: 30,
    earL: -26,
    earR: 26,
    tail: -24,
    tongue: 1,
  },
  sniff: {
    ...BASE_POSE,
    bodyRot: 7,
    headX: 16,
    headY: 32,
    headRot: 9,
    tail: -14,
    fn: 6,
    ff: 4,
  },
  bow: {
    ...BASE_POSE,
    bodyRot: 15,
    bodyY: 2,
    headX: 14,
    headY: 30,
    fn: -58,
    ff: -52,
    tail: -32,
    happy: 1,
    tongue: 1,
  },
  beg: {
    ...BASE_POSE,
    bodyRot: -36,
    bodyY: -6,
    headX: -18,
    headY: -18,
    sit: 1,
    fn: -70,
    ff: -64,
    tail: 30,
    happy: 1,
    tongue: 1,
  },
};

export const POSE_KEYS = Object.keys(BASE_POSE);

export const INITIAL_MOTION_STATE: MotionState = {
  phase: 0,
  stride: 0,
  time: 0,
  wag: 0,
  gazeX: 0,
  gazeY: 0,
  blink: 0,
  ear: 0,
};

export const round2 = (v: number): number => Math.round(100 * v) / 100;
export const rotatePivot = (deg: number, pivot: [number, number]): string =>
  `rotate(${round2(deg)} ${pivot[0]} ${pivot[1]})`;

export function interpolatePose(p0: Pose, p1: Pose, alpha: number): Pose {
  const result = { ...p0 };
  for (const k of POSE_KEYS) {
    result[k] = p0[k] + (p1[k] - p0[k]) * alpha;
  }
  return result;
}

export function evaluateFrame(
  pose: Pose,
  motion: MotionState = INITIAL_MOTION_STATE
): Record<string, string | number> {
  const sinPhase = Math.sin(motion.phase);
  const sinPhaseFar = Math.sin(motion.phase + Math.PI);
  const strideAmp = 20 + 10 * motion.stride;
  const bounceParam = (1 - Math.cos(2 * motion.phase)) / 2;
  const isWalking = +(motion.stride > 0.01);
  const breathing = Math.sin(2.4 * motion.time) * (1 - isWalking);

  const bodyYVal =
    pose.bodyY -
    bounceParam * (2.5 + 4 * motion.stride) * isWalking +
    0.6 * breathing;
  const bodyRotVal = pose.bodyRot + 1.6 * Math.sin(motion.phase) * isWalking;
  const counterBodyRot = -pose.bodyRot;

  const wagAmp = 5 + 17 * motion.wag;
  const wagSpeed = 1.2 + 2.6 * motion.wag;
  const tailAngle =
    pose.tail + Math.sin(motion.time * wagSpeed * Math.PI * 2) * wagAmp;

  const headBounce =
    -((1 - Math.cos(2 * motion.phase - 0.7)) / 2) *
      (2 + 3 * motion.stride) *
      isWalking +
    0.9 * breathing;

  return {
    body: `translate(${round2(pose.bodyX)} ${round2(bodyYVal)}) ${rotatePivot(
      bodyRotVal,
      BODY_CENTER
    )} translate(${BODY_CENTER[0]} 0) scale(${round2(
      pose.stretch
    )} 1) translate(${-BODY_CENTER[0]} 0)`,
    fn: `translate(${SHOULDER_NEAR[0]} ${SHOULDER_NEAR[1]}) rotate(${round2(
      pose.fn + counterBodyRot + sinPhase * strideAmp * isWalking
    )})`,
    ff: `translate(${SHOULDER_FAR[0]} ${SHOULDER_FAR[1]}) rotate(${round2(
      pose.ff + counterBodyRot + sinPhaseFar * strideAmp * isWalking
    )})`,
    bn: `translate(${HIP_NEAR[0]} ${HIP_NEAR[1]}) rotate(${round2(
      pose.bn + sinPhaseFar * strideAmp * isWalking
    )})`,
    bf: `translate(${HIP_FAR[0]} ${HIP_FAR[1]}) rotate(${round2(
      pose.bf + sinPhase * strideAmp * isWalking
    )})`,
    tail: rotatePivot(tailAngle, TAIL_BASE),
    haunch: `translate(0 ${round2(-(0.06 * pose.bodyRot))})`,
    head: `translate(${round2(pose.headX)} ${round2(
      pose.headY + headBounce
    )}) ${rotatePivot(
      pose.headRot + 1.4 * Math.sin(motion.phase) * isWalking,
      HEAD_CENTER
    )}`,
    earL: rotatePivot(
      pose.earL + motion.ear + 4 * Math.sin(2 * motion.phase) * isWalking,
      EAR_L_BASE
    ),
    earR: rotatePivot(
      pose.earR - motion.ear - 4 * Math.sin(2 * motion.phase) * isWalking,
      EAR_R_BASE
    ),
    eyes: `translate(${round2(3.4 * motion.gazeX)} ${round2(
      2.6 * motion.gazeY
    )})`,
    blink: `translate(0 ${round2(98 * motion.blink * 0.92)}) scale(1 ${round2(
      1 - 0.92 * motion.blink
    )})`,
    openEyes: round2(Math.max(0, pose.eyes - pose.happy)),
    happyEyes: round2(Math.min(pose.happy, pose.eyes)),
    shutEyes: round2(1 - pose.eyes),
    tongue: round2(pose.tongue * (1 - pose.mouth)),
    mouth: round2(pose.mouth),
    backLegs: round2(1 - pose.sit),
    haunchOpacity: round2(pose.sit * (1 - pose.front)),
    side: round2(1 - pose.front),
    ledge: round2(pose.front),
    shadow: `translate(${round2(0.6 * pose.bodyX)} 0) scale(${round2(
      1 - 0.05 * bounceParam * isWalking
    )} 1)`,
    shadowOpacity: round2(0.12 * (1 - pose.front)),
  };
}

// Toe slit path generator
export const toeSlit = (len: number): string => `M-3.5 ${len - 7} v5 M4.5 ${len - 7} v5`;

// Paw print path from module 49054
function generateToePuff(x: number, y: number, rx: number, ry: number, angleDeg: number): string {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const pt = (dx: number, dy: number) =>
    `${(x + dx * cos - dy * sin).toFixed(2)} ${(y + dx * sin + dy * cos).toFixed(2)}`;
  return `M${pt(rx, 0)}C${pt(rx, 0.5523 * ry)} ${pt(0.5523 * rx, ry)} ${pt(
    0,
    ry
  )}C${pt(-0.5523 * rx, ry)} ${pt(-rx, 0.5523 * ry)} ${pt(-rx, 0)}C${pt(
    -rx,
    -0.5523 * ry
  )} ${pt(-0.5523 * rx, -ry)} ${pt(0, -ry)}C${pt(0.5523 * rx, -ry)} ${pt(
    rx,
    -0.5523 * ry
  )} ${pt(rx, 0)}Z`;
}

export const PAW_PRINT_PATH: string =
  'M32 30.5c-7.6 0-15.6 8.3-15.6 15.5 0 5.4 4.2 8.3 9.2 8.3 2.6 0 4.5-1.1 6.4-1.1s3.8 1.1 6.4 1.1c5 0 9.2-2.9 9.2-8.3 0-7.2-8-15.5-15.6-15.5z' +
  generateToePuff(14.6, 29.2, 5.3, 6.9, -28) +
  generateToePuff(24.2, 16.6, 5.5, 7.3, -10) +
  generateToePuff(39.8, 16.6, 5.5, 7.3, 10) +
  generateToePuff(49.4, 29.2, 5.3, 6.9, 28);

