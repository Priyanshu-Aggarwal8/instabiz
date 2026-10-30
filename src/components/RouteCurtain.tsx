'use client';

import { useEffect, useRef } from 'react';

export function RouteCurtain({ initialHtml }: { initialHtml: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector('.tp-curtain') as HTMLElement | null;
    if (!el) return;

    // The intro curtain animation runs for ~1040ms
    const timer = setTimeout(() => {
      el.dataset.state = 'idle';
      delete document.documentElement.dataset.curtain;
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: initialHtml }}
    />
  );
}
