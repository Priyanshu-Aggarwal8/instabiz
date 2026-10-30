'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  initialHtml?: string;
}

export const Header: React.FC<HeaderProps> = ({ initialHtml }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const header = container.querySelector('#site-header') as HTMLElement | null;
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
    let lastY = window.scrollY;
    const handleScroll = () => {
      if (header) {
        const y = window.scrollY;
        const scrolled = y > 8;
        header.setAttribute('data-scrolled', scrolled ? 'true' : 'false');
        if (Math.abs(y - lastY) > 6) {
          header.setAttribute('data-hidden', y > lastY && y > 220 ? 'true' : 'false');
          lastY = y;
        }
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

  // Update dynamic active links and data-home on pathname change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const header = container.querySelector('#site-header') as HTMLElement | null;
    const dialog = container.querySelector('dialog.tp-menu') as HTMLDialogElement | null;

    // Close mobile menu on page change
    if (dialog?.open) {
      dialog.close();
    }

    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const isHome = currentPath === '/';

    if (header) {
      if (isHome) {
        header.setAttribute('data-home', 'true');
      } else {
        header.removeAttribute('data-home');
      }
    }

    const updateLink = (link: HTMLAnchorElement) => {
      const href = link.getAttribute('href');
      if (!href) return;

      let isActive = false;
      if (href === '/') {
        isActive = isHome;
      } else if (href === '/puppies') {
        isActive = currentPath === '/puppies' || currentPath.startsWith('/puppies/');
      } else {
        isActive = currentPath === href || currentPath.startsWith(href + '/');
      }

      link.setAttribute('data-active', isActive ? 'true' : 'false');
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    };

    // Update desktop nav links
    const navLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('.tp-header__nav a.tp-nav-link'));
    navLinks.forEach(updateLink);

    // Update mobile menu links
    const menuLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('.tp-menu a.tp-menu-link'));
    menuLinks.forEach((link) => {
      updateLink(link);
      link.onclick = () => {
        dialog?.close();
      };
    });
  }, [pathname]);

  return (
    <div
      ref={containerRef}
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: initialHtml || '' }}
    />
  );
};
