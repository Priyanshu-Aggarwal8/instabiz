export interface Point {
  x: number;
  y: number;
}

export interface Box {
  [index: number]: number;
  0: number; // left
  1: number; // top
  2: number; // right
  3: number; // bottom
}

export type TrackKind = 'page' | 'pin' | 'screen';

export interface StopTrack {
  kind: TrackKind;
  top: number;
  from?: number;
  to?: number;
}

export interface Stop {
  x: number;
  track: StopTrack;
  s: number; // scale
  behind: boolean;
  sink: number;
  box: Box;
}

export interface StopMeta {
  scene: HTMLElement | null;
  pose: string;
  facing: number;
  act: string;
  looks: HTMLElement[];
  track: HTMLElement | null;
}

export interface Journey {
  lane: boolean;
  stops: Stop[];
  meta: StopMeta[];
  holds: [number, number][];
  blend: number;
  mainTop: number;
}

export interface EvaluatedStep {
  x: number;
  y: number;
  s: number;
  front: boolean;
  airborne: boolean;
  k: number;
  t: number;
  walked: number;
}

export interface Pose {
  bodyRot: number;
  bodyX: number;
  bodyY: number;
  stretch: number;
  headX: number;
  headY: number;
  headRot: number;
  earL: number;
  earR: number;
  tail: number;
  fn: number;
  ff: number;
  bn: number;
  bf: number;
  sit: number;
  eyes: number;
  happy: number;
  tongue: number;
  mouth: number;
  front: number;
  [key: string]: number;
}

export interface MotionState {
  phase: number;
  stride: number;
  time: number;
  wag: number;
  gazeX: number;
  gazeY: number;
  blink: number;
  ear: number;
}

