'use client';

import React, { useEffect, useRef } from 'react';

interface HeaderProps {
  initialHtml?: string;
}

export const Header: React.FC<HeaderProps> = ({ initialHtml }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const header = container.querySelector('#site-header');
    const menuBtn = container.querySelector('button[aria-haspopup="dialog"]');
    const dialog = container.querySelector('dialog.tp-menu') as HTMLDialogElement | null;
    const closeBtn = dialog?.querySelector('button');

    // Handle dialog open/close
    const handleOpen = () => {
      dialog?.showModal();
    };
    const handleClose = () => {
      dialog?.close();
    };

    menuBtn?.addEventListener('click', handleOpen);
    closeBtn?.addEventListener('click', handleClose);

    // Close when clicking backdrop
    const handleBackdrop = (e: MouseEvent) => {
      if (dialog && e.target === dialog) {
        dialog.close();
      }
    };
    dialog?.addEventListener('click', handleBackdrop);

    // Scroll listener for header elevation
    const handleScroll = () => {
      if (header) {
        const scrolled = window.scrollY > 20;
        header.setAttribute('data-scrolled', scrolled ? 'true' : 'false');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      menuBtn?.removeEventListener('click', handleOpen);
      closeBtn?.removeEventListener('click', handleClose);
      dialog?.removeEventListener('click', handleBackdrop);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: initialHtml || '' }}
    />
  );
};
