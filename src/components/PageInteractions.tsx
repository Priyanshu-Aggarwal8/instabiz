'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

export function PageInteractions() {
  useEffect(() => {
    // 1. Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // 2. Header Dynamic Behavior (elevation + hide on scroll down, show on scroll up + active route sync)
    const header = document.querySelector('#site-header') as HTMLElement | null;
    let lastY = window.scrollY;

    const syncNavbar = () => {
      const path = window.location.pathname;
      const isHome = path === '/';
      if (header) {
        if (isHome) {
          header.setAttribute('data-home', 'true');
        } else {
          header.removeAttribute('data-home');
        }
      }
      document.querySelectorAll<HTMLAnchorElement>('.tp-header__nav a.tp-nav-link, .tp-menu a.tp-menu-link').forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;
        const isActive = href === '/' ? isHome : (href === '/puppies' ? (path === '/puppies' || path.startsWith('/puppies/')) : (path === href || path.startsWith(href + '/')));
        link.setAttribute('data-active', isActive ? 'true' : 'false');
        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };
    syncNavbar();
    window.addEventListener('popstate', syncNavbar);

    const onScroll = () => {
      const y = window.scrollY;
      if (header) {
        header.setAttribute('data-scrolled', y > 8 ? 'true' : 'false');
        if (Math.abs(y - lastY) > 6) {
          header.setAttribute('data-hidden', y > lastY && y > 220 ? 'true' : 'false');
          lastY = y;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // 3. Smooth Scroll Reveal ([data-reveal] & [data-armed] -> [data-revealed])
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.setAttribute('data-revealed', 'true');
            revealObserver.unobserve(target);
          }
        });
      },
      { rootMargin: '0px 0px 50px 0px', threshold: 0 }
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        (el as HTMLElement).setAttribute('data-revealed', 'true');
      } else {
        (el as HTMLElement).setAttribute('data-armed', 'true');
        revealObserver.observe(el);
      }
    });

    // 4. Narrative Scene Tracking (data-pup-scene)
    const sceneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            target.setAttribute('data-here', 'true');
            target.setAttribute('data-visited', 'true');
          } else {
            target.removeAttribute('data-here');
          }
        });
      },
      { rootMargin: '-15% 0px -15% 0px' }
    );
    document.querySelectorAll('[data-pup-scene]').forEach((s) => sceneObserver.observe(s));

    // 5. Meet the Pups Treadmill Horizontal Scroll & Pinning
    const meetSec = document.querySelector('.tp-meet') as HTMLElement | null;
    const meetTrack = document.querySelector('.tp-meet__track') as HTMLElement | null;
    const meetHall = document.querySelector('.tp-meet__hall') as HTMLElement | null;
    const meetHead = document.querySelector('.tp-meet__head') as HTMLElement | null;
    const pinRange = document.querySelector('.tp-meet [data-pin-range]') as HTMLElement | null;

    const updateMeetLayout = () => {
      const isDesktop = window.innerWidth >= 1024;
      const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const shouldPin = isDesktop && !isReduced;

      if (shouldPin && meetSec && pinRange && meetTrack && meetHall) {
        meetSec.dataset.pinned = 'true';
        pinRange.style.setProperty('--pinned', '1');

        const stage = meetHall.parentElement;
        const headH = meetHead ? meetHead.offsetTop + meetHead.offsetHeight : 0;
        const plates = Array.from(meetTrack.querySelectorAll('.tp-door__plate')) as HTMLElement[];
        const maxPlateH = Math.max(64, ...plates.map((p) => p.offsetHeight || 64));
        const floorH = (meetHall.querySelector('.tp-meet__floor') as HTMLElement)?.offsetHeight ?? 0;
        const availH = (stage?.clientHeight ?? window.innerHeight) - headH - floorH - maxPlateH - 40;
        const doorW = Math.max(128, Math.min(256, 0.15 * window.innerWidth, availH / 1.3));
        meetHall.style.setProperty('--door-w', `${doorW.toFixed(0)}px`);

        const scrollSpan = Math.max(0, meetTrack.scrollWidth - window.innerWidth);
        const pinHeight = Math.round(0.8 * scrollSpan);
        pinRange.style.height = `calc(100vh + ${pinHeight}px)`;
      } else if (meetSec && pinRange && meetHall) {
        delete meetSec.dataset.pinned;
        pinRange.style.setProperty('--pinned', '0');
        pinRange.style.removeProperty('height');
        meetHall.style.removeProperty('--door-w');
      }
    };

    updateMeetLayout();
    window.addEventListener('resize', updateMeetLayout);

    const onMeetScroll = () => {
      if (!meetTrack || !pinRange || window.innerWidth < 1024) return;
      const rect = pinRange.getBoundingClientRect();
      const maxScroll = Math.max(0, meetTrack.scrollWidth - window.innerWidth);

      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - window.innerHeight)));
        const x = -progress * maxScroll;
        meetTrack.style.transform = `matrix(1, 0, 0, 1, ${x.toFixed(1)}, 0)`;
        meetHall?.style.setProperty('--floor-x', `${x.toFixed(1)}px`);
        pinRange.style.setProperty('--pinned', '1');

        // Open puppy doors dynamically as they pass center view
        const centerThreshold = 0.38 * window.innerWidth;
        Array.from(meetTrack.children).forEach((door) => {
          const d = door as HTMLElement;
          const doorX = d.offsetLeft + x;
          const isOpen = doorX < centerThreshold;
          if (d.dataset.open !== String(isOpen)) {
            d.dataset.open = String(isOpen);
            if (isOpen) {
              window.dispatchEvent(new CustomEvent('pup:cue', { detail: { look: d, secs: 0.9 } }));
            }
          }
        });
      } else if (rect.top > 0) {
        meetTrack.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
        meetHall?.style.setProperty('--floor-x', '0px');
      }
    };
    if (meetTrack && pinRange) {
      window.addEventListener('scroll', onMeetScroll, { passive: true });
    }

    // 6. Concierge Chat Journey Timeline
    const chatSteps = Array.from(document.querySelectorAll('.tp-chat__step')) as HTMLElement[];
    const phoneStatus = document.querySelector('.tp-phone__status');

    if (chatSteps.length > 0) {
      const chatObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const activeIdx = chatSteps.indexOf(entry.target as HTMLElement);
              if (activeIdx >= 0) {
                chatSteps.forEach((s, i) => {
                  if (i === activeIdx) {
                    s.setAttribute('data-active', 'true');
                    s.removeAttribute('data-done');
                  } else if (i < activeIdx) {
                    s.removeAttribute('data-active');
                    s.setAttribute('data-done', 'true');
                  } else {
                    s.removeAttribute('data-active');
                    s.removeAttribute('data-done');
                  }
                });

                if (phoneStatus) phoneStatus.textContent = 'typing…';
                setTimeout(() => {
                  if (phoneStatus) phoneStatus.textContent = 'online';
                  const msg = document.querySelector(`.tp-msg-group[data-step="${activeIdx}"]`);
                  if (msg) msg.setAttribute('data-show', 'true');
                }, 500);
              }
            }
          });
        },
        { rootMargin: '-25% 0px -55% 0px' }
      );
      chatSteps.forEach((step) => chatObserver.observe(step));
    }

    // 7. Sticker Chips Filter on /puppies
    const chips = Array.from(document.querySelectorAll('.tp-sticker-chip')) as HTMLElement[];
    const cards = Array.from(document.querySelectorAll('.tp-sketchbook__item')) as HTMLElement[];

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
        chip.setAttribute('aria-pressed', 'true');
        const filterText = chip.textContent?.trim().toLowerCase() || 'everywhere';

        cards.forEach((card) => {
          const cardText = card.textContent?.toLowerCase() || '';
          if (filterText === 'everywhere' || cardText.includes(filterText)) {
            card.style.display = '';
            card.style.opacity = '1';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    // 8. FAQ Accordion Click Handler
    const qaItems = Array.from(document.querySelectorAll('.tp-qa')) as HTMLElement[];
    qaItems.forEach((qa) => {
      const q = qa.querySelector('.tp-qa__q');
      const a = qa.querySelector('.tp-qa__a') as HTMLElement | null;
      if (q && a) {
        q.addEventListener('click', () => {
          const isExpanded = qa.getAttribute('data-open') === 'true';
          qa.setAttribute('data-open', isExpanded ? 'false' : 'true');
          if (isExpanded) {
            a.style.display = 'none';
          } else {
            a.style.display = 'block';
          }
        });
      }
    });

    // 9. Puppy Storybook Image Gallery Interactions (Fallback / Universal)
    const storypage = document.querySelector('.tp-storypage') as HTMLElement | null;
    const prevBtn = document.querySelector('button[aria-label="Previous photo"]') as HTMLButtonElement | null;
    const nextBtn = document.querySelector('button[aria-label="Next photo"]') as HTMLButtonElement | null;
    const counterSpan = document.querySelector('.tp-storypage span.self-center') as HTMLElement | null;
    const thumbList = document.querySelector('ul[aria-label^="All photos"]') as HTMLElement | null;
    const mainBtn = storypage?.querySelector('button.absolute.inset-0') as HTMLButtonElement | null;

    if (storypage && prevBtn && nextBtn && mainBtn && thumbList) {
      const thumbButtons = Array.from(thumbList.querySelectorAll('button')) as HTMLButtonElement[];
      const total = thumbButtons.length;
      let activeIndex = 0;

      const updateSlide = (idx: number, direction: number = 1) => {
        activeIndex = (idx % total + total) % total;
        if (counterSpan) counterSpan.textContent = `${activeIndex + 1} / ${total}`;

        const thumb = thumbButtons[activeIndex];
        const thumbImg = thumb?.querySelector('img');
        const isVideo = thumb?.getAttribute('aria-label')?.includes('video') || Boolean(thumb?.querySelector('span'));

        if (isVideo) {
          const videoUrl = thumb?.dataset.videoUrl || '';
          const posterUrl = thumbImg?.getAttribute('src') || '';
          mainBtn.innerHTML = `<video src="${videoUrl}" poster="${posterUrl}" class="size-full object-cover" muted loop playsinline autoplay></video>`;
          mainBtn.querySelector('video')?.play().catch(() => {});
        } else if (thumbImg) {
          const src = thumbImg.getAttribute('src') || '';
          const srcset = thumbImg.getAttribute('srcset') || '';
          const objPos = thumbImg.style.objectPosition || '50% 50%';
          const bgColor = thumbImg.style.backgroundColor || '#785838';

          mainBtn.style.transition = 'none';
          mainBtn.style.transformOrigin = direction > 0 ? '0% 50%' : '100% 50%';
          mainBtn.style.clipPath = direction > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';

          mainBtn.innerHTML = `<img fetchpriority="high" loading="eager" decoding="async" data-nimg="fill"
            style="position: absolute; height: 100%; width: 100%; inset: 0px; object-fit: cover; object-position: ${objPos}; color: transparent; background-color: ${bgColor};"
            sizes="(min-width: 1024px) 55vw, 92vw"
            srcset="${srcset}"
            src="${src}">`;

          requestAnimationFrame(() => {
            mainBtn.style.transition = 'clip-path 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease';
            mainBtn.style.clipPath = 'inset(0% 0% 0% 0%)';
          });
        }

        thumbButtons.forEach((btn, i) => {
          const isActive = i === activeIndex;
          btn.setAttribute('aria-current', isActive ? 'true' : 'false');
          btn.className = isActive
            ? 'relative block h-24 w-20 overflow-hidden rounded-[0.9rem] border-[3px] transition-transform duration-300 md:h-28 md:w-24 -rotate-3 -translate-y-1 border-toffee-deep'
            : 'relative block h-24 w-20 overflow-hidden rounded-[0.9rem] border-[3px] transition-transform duration-300 md:h-28 md:w-24 border-cocoa/30 hover:-rotate-2 hover:border-cocoa';
        });
      };

      prevBtn.onclick = (e) => { e.preventDefault(); updateSlide(activeIndex - 1, -1); };
      nextBtn.onclick = (e) => { e.preventDefault(); updateSlide(activeIndex + 1, 1); };
      thumbButtons.forEach((btn, idx) => {
        btn.onclick = (e) => { e.preventDefault(); updateSlide(idx, idx >= activeIndex ? 1 : -1); };
      });
    }

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener('scroll', onScroll);
      if (meetTrack && pinRange) {
        window.removeEventListener('scroll', onMeetScroll);
      }
      revealObserver.disconnect();
      sceneObserver.disconnect();
    };
  }, []);

  return null;
}
