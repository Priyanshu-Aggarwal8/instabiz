import { Puppet } from './Puppet';
import { POSES } from './puppetConstants';
import { Pose } from './types';

export interface MotionContext {
  d: Puppet;
  rest: Pose;
  facing: number;
  say: (text: string, duration?: number) => void;
  hearts: () => void;
}

export type QueuedAction = [number, (time: number) => void];

const flip = (dir: number): number => (dir === 1 ? -1 : 1);

const ALL_TRICKS = [
  'woof',
  'spin',
  'beg',
  'bow',
  'hop',
  'love',
  'tilt',
  'sneeze',
];
let trickDeck: string[] = [];

export const PUPPET_MOTIONS: Record<
  string,
  (ctx: MotionContext, time: number) => QueuedAction[]
> = {
  woof: ({ d, say }, now) => [
    [now, t => { d.woof(t); say('woof!'); }],
    [now + 0.42, t => { d.woof(t); say('woof woof!'); }],
  ],
  spin: ({ d, rest, facing, say }, now) => [
    [now, () => { d.setPose('stand'); d.hop(0.5); }],
    [now + 0.14, () => d.face(flip(facing))],
    [now + 0.38, () => d.face(facing)],
    [now + 0.62, () => d.face(flip(facing))],
    [now + 0.86, () => { d.face(facing); say('wheee!'); }],
    [now + 1.3, () => d.setPose(rest)],
  ],
  beg: ({ d, rest, say }, now) => [
    [now, () => { d.setPose('beg'); d.wag(1); say('treat, please?', 1.7); }],
    [now + 1.9, () => { d.setPose(rest); d.wag(0.7); }],
  ],
  bow: ({ d, rest, say }, now) => [
    [now, () => { d.setPose('bow'); d.wag(1); say('play with me!'); }],
    [now + 0.55, () => d.hop(0.45)],
    [now + 1.7, () => { d.setPose(rest); d.wag(0.7); }],
  ],
  hop: ({ d, rest, say }, now) => [
    [now, () => { d.setPose('hop'); d.hop(1.1); say('boing!'); }],
    [now + 0.36, () => d.setPose(rest)],
    [now + 0.62, () => { d.setPose('hop'); d.hop(0.8); }],
    [now + 0.98, () => d.setPose(rest)],
  ],
  love: ({ d, rest, say, hearts }, now) => [
    [
      now,
      () => {
        d.setPose({ ...rest, happy: 1, tongue: 1 });
        d.wag(1);
        hearts();
        say('I like you!', 1.5);
      },
    ],
    [now + 1.9, () => { d.setPose(rest); d.wag(0.7); }],
  ],
  tilt: ({ d, say }, now) => [
    [now, () => { d.cock(-14); say('hm?'); }],
    [now + 0.8, () => d.cock(12)],
    [now + 1.6, () => d.cock(0)],
  ],
  sneeze: ({ d, say }, now) => [
    [now, () => d.cock(-8)],
    [
      now + 0.32,
      t => {
        d.cock(10);
        d.jolt(1.4);
        d.hop(0.35);
        d.yawn(t, 0.22);
        say('achoo!');
      },
    ],
    [now + 0.8, () => d.cock(0)],
  ],
  zoomies: ({ d, rest, facing, say }, now) => [
    [now, () => { d.setPose('walk'); d.wag(1); say('zoomies!', 2); }],
    [now + 0.05, () => { d.face(1); d.dash(70); }],
    [now + 0.5, () => { d.face(-1); d.dash(-70); }],
    [now + 0.98, () => { d.face(1); d.dash(50); }],
    [now + 1.4, () => { d.face(-1); d.dash(-30); }],
    [now + 1.78, () => { d.face(1); d.dash(0); }],
    [now + 2.25, () => { d.face(facing); d.setPose(rest); d.wag(0.7); }],
  ],
  peekaboo: ({ d, say }, now) => [
    [now, () => d.setPose({ ...POSES.peek, headY: 120 })],
    [now + 0.55, () => { d.setPose('peek'); d.jolt(1.2); say('peekaboo!'); }],
  ],
  wake: ({ d, rest, say }, now) => [
    [now, t => { d.setPose('settle'); d.yawn(t, 0.9); say('*yaaawn*'); }],
    [
      now + 1.25,
      () => {
        d.setPose({ ...POSES.settle, happy: 1 });
        d.wag(0.8);
        say('five more minutes…', 1.6);
      },
    ],
    [now + 3.1, () => { d.setPose(rest); d.wag(0); say('zzz', 2); }],
  ],
};

export function emitHearts(container: HTMLElement, x: number, y: number): void {
  for (let r = 0; r < 5; r++) {
    const s = document.createElement('span');
    s.className = 'pup-heart';
    s.textContent = '♥';
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    container.append(s);
    const i = (Math.random() - 0.5) * 90;
    const n = -70 - 60 * Math.random();
    s.animate(
      [
        { transform: 'translate(-50%, 0) scale(0.4)', opacity: 0 },
        { opacity: 1, offset: 0.2 },
        {
          transform: `translate(calc(-50% + ${i.toFixed(0)}px), ${n.toFixed(
            0
          )}px) scale(1.1)`,
          opacity: 0,
        },
      ],
      {
        duration: 1150 + 110 * r,
        delay: 80 * r,
        easing: 'cubic-bezier(.2,.7,.3,1)',
        fill: 'backwards',
      }
    ).finished.then(
      () => s.remove(),
      () => s.remove()
    );
  }
}

export function pickTrick(lastTrick: string | null, clickCount: number): string {
  if (clickCount >= 4) return 'zoomies';
  if (!trickDeck.length) {
    trickDeck = ALL_TRICKS.filter(t => t !== lastTrick).sort(
      () => Math.random() - 0.5
    );
  }
  return trickDeck.pop() ?? 'woof';
}

