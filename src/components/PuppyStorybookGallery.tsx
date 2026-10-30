'use client';

import { useEffect, useCallback, useRef } from 'react';
import { puppies } from '@/data/puppies';
import { goneHomePuppies } from '@/data/goneHome';
import type { PuppyMedia } from '@/types';

interface PuppyStorybookGalleryProps {
  slug?: string;
}

export function PuppyStorybookGallery({ slug }: PuppyStorybookGalleryProps) {
  const activeIndexRef = useRef(0);
  const isDialogOpenRef = useRef(false);

  const initGallery = useCallback(() => {
    const storypage = document.querySelector('.tp-storypage') as HTMLElement | null;
    const prevBtn = document.querySelector('button[aria-label="Previous photo"]') as HTMLButtonElement | null;
    const nextBtn = document.querySelector('button[aria-label="Next photo"]') as HTMLButtonElement | null;
    const counterSpan = document.querySelector('.tp-storypage span.self-center') as HTMLElement | null;
    const thumbList = document.querySelector('ul[aria-label^="All photos"]') as HTMLElement | null;
    const dialog = document.querySelector('dialog[data-lenis-prevent]') as HTMLDialogElement | null;

    if (!storypage || !prevBtn || !nextBtn) return;

    // Find main display button (the first full-size button inside storypage)
    const mainBtn = storypage.querySelector('button.absolute.inset-0') as HTMLButtonElement | null;
    if (!mainBtn) return;

    // Retrieve structured puppy media if slug provided
    const currentSlug = slug || window.location.pathname.split('/').filter(Boolean).pop() || '';
    const allPuppies = [...puppies, ...goneHomePuppies];
    const pupData = allPuppies.find((p) => p.slug === currentSlug);
    const mediaList: PuppyMedia[] = (pupData?.media as PuppyMedia[]) || [];

    // Thumbnail elements
    const thumbButtons = Array.from(
      thumbList ? thumbList.querySelectorAll('button') : []
    ) as HTMLButtonElement[];
    const total = Math.max(thumbButtons.length, mediaList.length);

    if (total <= 1) return;

    const puppyName = pupData?.name || mainBtn.getAttribute('aria-label')?.split(',')[0]?.replace('Open ', '') || 'Puppy';

    const renderSlide = (idx: number, direction: number = 1) => {
      activeIndexRef.current = (idx % total + total) % total;
      const current = activeIndexRef.current;
      const structuredMedia = mediaList[current];
      const thumbBtn = thumbButtons[current];
      const thumbImg = thumbBtn?.querySelector('img');

      // 1. Update counter
      if (counterSpan) {
        counterSpan.textContent = `${current + 1} / ${total}`;
      }

      // 2. Determine if video or image
      const isVideo =
        structuredMedia?.kind === 'video' ||
        thumbBtn?.getAttribute('aria-label')?.includes('video') ||
        Boolean(thumbBtn?.querySelector('span'));

      const mediaType = isVideo ? 'video' : 'photo';
      mainBtn.setAttribute('aria-label', `Open ${puppyName}, ${mediaType} ${current + 1} of ${total} full screen`);

      // 3. Prepare visual transition
      mainBtn.style.transition = 'none';
      mainBtn.style.transformOrigin = direction > 0 ? '0% 50%' : '100% 50%';
      mainBtn.style.clipPath = direction > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
      mainBtn.style.opacity = '0.7';

      // 4. Update main content (image or video)
      if (isVideo) {
        const videoUrl = structuredMedia?.url || '';
        const posterUrl = structuredMedia?.poster?.url || thumbImg?.getAttribute('src') || '';
        const altText = structuredMedia?.alt || `${puppyName} video`;

        mainBtn.innerHTML = `
          <video src="${videoUrl}" poster="${posterUrl}" class="size-full object-cover" muted loop playsinline autoplay aria-label="${altText}"></video>
        `;
        const videoEl = mainBtn.querySelector('video');
        videoEl?.play().catch(() => {});
      } else {
        const imgSrc = structuredMedia?.url || thumbImg?.getAttribute('src') || thumbImg?.src || '';
        const rawSrcset = thumbImg?.getAttribute('srcset') || thumbImg?.getAttribute('srcSet') || thumbImg?.srcset || '';
        const srcset = rawSrcset || `${imgSrc} 384w, ${imgSrc} 640w, ${imgSrc} 1080w, ${imgSrc} 1920w`;
        const altText = structuredMedia?.alt || thumbImg?.getAttribute('alt') || `${puppyName} photo`;
        const objPos = (structuredMedia?.focalX !== undefined && structuredMedia?.focalY !== undefined)
          ? `${structuredMedia.focalX * 100}% ${structuredMedia.focalY * 100}%`
          : (thumbImg?.style.objectPosition || '50% 50%');
        const bgColor = structuredMedia?.color || thumbImg?.style.backgroundColor || '#785838';

        mainBtn.innerHTML = `
          <img alt="${altText}" fetchpriority="high" loading="eager" decoding="async" data-nimg="fill"
            style="position: absolute; height: 100%; width: 100%; inset: 0px; object-fit: cover; object-position: ${objPos}; color: transparent; background-color: ${bgColor};"
            sizes="(min-width: 1024px) 55vw, 92vw"
            srcset="${srcset}"
            src="${imgSrc}">
        `;
      }

      // Animate in
      requestAnimationFrame(() => {
        mainBtn.style.transition = 'clip-path 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease';
        mainBtn.style.clipPath = 'inset(0% 0% 0% 0%)';
        mainBtn.style.opacity = '1';
      });

      // 5. Update active thumbnail styles
      thumbButtons.forEach((btn, i) => {
        const isActive = i === current;
        btn.setAttribute('aria-current', isActive ? 'true' : 'false');
        if (isActive) {
          btn.className =
            'relative block h-24 w-20 overflow-hidden rounded-[0.9rem] border-[3px] transition-transform duration-300 md:h-28 md:w-24 -rotate-3 -translate-y-1 border-toffee-deep';
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          btn.className =
            'relative block h-24 w-20 overflow-hidden rounded-[0.9rem] border-[3px] transition-transform duration-300 md:h-28 md:w-24 border-cocoa/30 hover:-rotate-2 hover:border-cocoa';
        }
      });

      // 6. Update dialog if open
      if (dialog && isDialogOpenRef.current) {
        updateDialogContent(dialog, current);
      }
    };

    const updateDialogContent = (d: HTMLDialogElement, current: number) => {
      const item = mediaList[current];
      const thumbBtn = thumbButtons[current];
      const thumbImg = thumbBtn?.querySelector('img');
      const isVideo = item?.kind === 'video' || thumbBtn?.getAttribute('aria-label')?.includes('video');
      const mediaType = isVideo ? 'video' : 'photo';
      const label = `${puppyName}, ${mediaType} ${current + 1} of ${total}`;

      d.innerHTML = `
        <div class="flex h-full flex-col">
          <div class="flex items-center justify-between gap-4 px-4 py-3">
            <p class="font-scrawl text-lg text-milk">${label}</p>
            <button type="button" class="tp-dialog-close h-11 rounded-full bg-milk px-5 font-semibold text-cocoa">Close</button>
          </div>
          <div class="relative flex-1 touch-pan-y flex items-center justify-center p-4">
            ${
              isVideo
                ? `<video src="${item?.url || ''}" poster="${item?.poster?.url || thumbImg?.getAttribute('src') || thumbImg?.src || ''}" controls autoplay playsinline class="max-h-full max-w-full object-contain"></video>`
                : `<img src="${item?.url || thumbImg?.getAttribute('src') || thumbImg?.src || ''}" alt="${item?.alt || label}" class="max-h-full max-w-full object-contain">`
            }
          </div>
          <div class="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <button type="button" class="tp-dialog-prev grid size-12 place-items-center rounded-full border-2 border-milk bg-cocoa/80 text-xl font-bold text-milk">‹</button>
            <span class="self-center rounded-full bg-milk/20 px-4 py-1 text-sm font-semibold text-milk">${current + 1} / ${total}</span>
            <button type="button" class="tp-dialog-next grid size-12 place-items-center rounded-full border-2 border-milk bg-cocoa/80 text-xl font-bold text-milk">›</button>
          </div>
        </div>
      `;

      d.querySelector('.tp-dialog-close')?.addEventListener('click', () => {
        d.close();
        isDialogOpenRef.current = false;
      });
      d.querySelector('.tp-dialog-prev')?.addEventListener('click', () => {
        renderSlide(activeIndexRef.current - 1, -1);
      });
      d.querySelector('.tp-dialog-next')?.addEventListener('click', () => {
        renderSlide(activeIndexRef.current + 1, 1);
      });
    };

    // Event listener: Next button
    const handleNext = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      renderSlide(activeIndexRef.current + 1, 1);
    };

    // Event listener: Prev button
    const handlePrev = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      renderSlide(activeIndexRef.current - 1, -1);
    };

    nextBtn.addEventListener('click', handleNext);
    prevBtn.addEventListener('click', handlePrev);

    // Event listeners: Thumbnail clicks
    const thumbHandlers: Array<{ el: HTMLElement; fn: (e: Event) => void }> = [];
    thumbButtons.forEach((btn, idx) => {
      const fn = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const dir = idx >= activeIndexRef.current ? 1 : -1;
        renderSlide(idx, dir);
      };
      btn.addEventListener('click', fn);
      thumbHandlers.push({ el: btn, fn });
    });

    // Event listener: Main button opens dialog
    const handleMainClick = () => {
      if (dialog) {
        isDialogOpenRef.current = true;
        updateDialogContent(dialog, activeIndexRef.current);
        dialog.showModal();
      }
    };
    mainBtn.addEventListener('click', handleMainClick);

    // Dialog backdrop click closes dialog
    if (dialog) {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          dialog.close();
          isDialogOpenRef.current = false;
        }
      });
      dialog.addEventListener('close', () => {
        isDialogOpenRef.current = false;
      });
    }

    // Keyboard navigation (ArrowLeft, ArrowRight)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        renderSlide(activeIndexRef.current + 1, 1);
      } else if (e.key === 'ArrowLeft') {
        renderSlide(activeIndexRef.current - 1, -1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Touch swipe gestures on storypage
    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          renderSlide(activeIndexRef.current + 1, 1);
        } else {
          renderSlide(activeIndexRef.current - 1, -1);
        }
      }
    };

    storypage.addEventListener('touchstart', handleTouchStart, { passive: true });
    storypage.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      nextBtn.removeEventListener('click', handleNext);
      prevBtn.removeEventListener('click', handlePrev);
      mainBtn.removeEventListener('click', handleMainClick);
      thumbHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      window.removeEventListener('keydown', handleKeyDown);
      storypage.removeEventListener('touchstart', handleTouchStart);
      storypage.removeEventListener('touchend', handleTouchEnd);
    };
  }, [slug]);

  useEffect(() => {
    // Run after DOM has painted
    const cleanup = initGallery();
    return () => {
      if (cleanup) cleanup();
    };
  }, [initGallery]);

  return null;
}
