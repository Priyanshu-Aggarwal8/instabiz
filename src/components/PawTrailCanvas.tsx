'use client';

import { useEffect, useRef } from 'react';

export function PawTrailCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function t(e: number, t: number, a: number, r: number, s: number) {
      const i = (s * Math.PI) / 180;
      const n = Math.cos(i);
      const o = Math.sin(i);
      const l = (a: number, r: number) =>
        `${(e + a * n - r * o).toFixed(2)} ${(t + a * o + r * n).toFixed(2)}`;
      return `M${l(a, 0)}C${l(a, 0.5523 * r)} ${l(0.5523 * a, r)} ${l(
        0,
        r
      )}C${l(-(0.5523 * a), r)} ${l(-a, 0.5523 * r)} ${l(-a, 0)}C${l(
        -a,
        -(0.5523 * r)
      )} ${l(-(0.5523 * a), -r)} ${l(0, -r)}C${l(0.5523 * a, -r)} ${l(
        a,
        -(0.5523 * r)
      )} ${l(a, 0)}Z`;
    }

    const pawD =
      'M32 30.5c-7.6 0-15.6 8.3-15.6 15.5 0 5.4 4.2 8.3 9.2 8.3 2.6 0 4.5-1.1 6.4-1.1s3.8 1.1 6.4 1.1c5 0 9.2-2.9 9.2-8.3 0-7.2-8-15.5-15.6-15.5z' +
      t(14.6, 29.2, 5.3, 6.9, -28) +
      t(24.2, 16.6, 5.5, 7.3, -10) +
      t(39.8, 16.6, 5.5, 7.3, 10) +
      t(49.4, 29.2, 5.3, 6.9, 28);

    const pawPath = new Path2D(pawD);
    const prints: { x: number; y: number; angle: number; born: number }[] = [];
    let dpr = 1;
    let animFrame = 0;
    let running = false;
    let lastX = NaN;
    let lastY = NaN;
    let dist = 0;
    let side = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();

    const render = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = prints.length - 1; i >= 0; i--) {
        const p = prints[i];
        const age = now - p.born;
        if (age > 1000) {
          prints.splice(i, 1);
          continue;
        }
        const alpha = age < 600 ? 1 : 1 - (age - 600) / 400;
        ctx.globalAlpha = 0.42 * alpha * alpha;
        ctx.setTransform(0.27 * dpr, 0, 0, 0.27 * dpr, p.x * dpr, p.y * dpr);
        ctx.rotate(p.angle);
        ctx.translate(-32, -34);
        ctx.fillStyle = '#c2622b';
        ctx.fill(pawPath);
      }
      if (prints.length > 0) {
        animFrame = requestAnimationFrame(render);
      } else {
        running = false;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (Number.isNaN(lastX)) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      dist += Math.hypot(dx, dy);
      if (dist >= 46) {
        dist = 0;
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        side = -side;
        const offset = 7 * side;
        prints.push({
          x: e.clientX + Math.cos(angle) * offset + 14,
          y: e.clientY + Math.sin(angle) * offset + 16,
          angle,
          born: performance.now(),
        });
        if (prints.length > 14) prints.shift();
        if (!running) {
          running = true;
          animFrame = requestAnimationFrame(render);
        }
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] size-full"
    />
  );
}

