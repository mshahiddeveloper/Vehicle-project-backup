'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function MobilePullToRefresh() {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const currentPullRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = () => window.innerWidth < 768;

    const getScrollTop = () => {
      return (
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobile() || isRefreshingRef.current) return;

      // Only prepare pull if page is at the very top
      if (getScrollTop() <= 4) {
        startXRef.current = e.touches[0].clientX;
        startYRef.current = e.touches[0].clientY;
      } else {
        startXRef.current = null;
        startYRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || isRefreshingRef.current || !isMobile()) return;

      const currentScroll = getScrollTop();
      if (currentScroll > 4) {
        startYRef.current = null;
        startXRef.current = null;
        if (currentPullRef.current > 0) {
          currentPullRef.current = 0;
          setPullDistance(0);
          setIsPulling(false);
        }
        return;
      }

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startYRef.current;
      const diffX = currentX - (startXRef.current ?? currentX);

      // User is swiping UP to scroll DOWN the page: disengage immediately!
      if (diffY <= 0) {
        startYRef.current = null;
        startXRef.current = null;
        if (currentPullRef.current > 0) {
          currentPullRef.current = 0;
          setPullDistance(0);
          setIsPulling(false);
        }
        return;
      }

      // Horizontal gesture dominant (e.g. car cards scroll): cancel pull
      if (Math.abs(diffX) > Math.abs(diffY)) {
        startYRef.current = null;
        startXRef.current = null;
        if (currentPullRef.current > 0) {
          currentPullRef.current = 0;
          setPullDistance(0);
          setIsPulling(false);
        }
        return;
      }

      // Vertical pull-down gesture
      if (diffY > 10) {
        if (e.cancelable) {
          e.preventDefault();
        }

        const distance = Math.min(105, Math.pow(diffY, 0.85) * 1.45);
        currentPullRef.current = distance;
        setPullDistance(distance);
        setIsPulling(true);
      }
    };

    const handleTouchEnd = () => {
      if (isRefreshingRef.current || !isMobile()) return;

      const current = currentPullRef.current;
      startYRef.current = null;
      startXRef.current = null;
      setIsPulling(false);

      if (current >= 62) {
        triggerRaceRefresh();
      } else if (current > 0) {
        currentPullRef.current = 0;
        setPullDistance(0);
      }
    };

    const triggerRaceRefresh = () => {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      setIsLaunching(false);
      setPullDistance(95);

      try {
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      } catch {}

      // Fast priority data refresh
      try {
        router.refresh();
        window.dispatchEvent(new CustomEvent('safarpk_pull_refresh'));
      } catch {}

      // Keep car running while loading, then launch off top
      setTimeout(() => {
        setIsLaunching(true);

        setTimeout(() => {
          setPullDistance(0);
          currentPullRef.current = 0;

          setTimeout(() => {
            setIsRefreshing(false);
            setIsLaunching(false);
            isRefreshingRef.current = false;
          }, 300);
        }, 350);
      }, 700);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [router]);

  if (pullDistance <= 0 && !isRefreshing) return null;

  const isReady = pullDistance >= 62;

  return (
    <div
      style={{
        height: `${pullDistance}px`,
        transition: isPulling
          ? 'none'
          : 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="md:hidden w-full overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-white border-b border-slate-200/80 relative flex flex-col items-center justify-end select-none pointer-events-none z-30"
    >
      {/* Light subtle clean track line */}
      <div className="absolute inset-0 flex items-center justify-center opacity-25">
        <div className="w-16 h-full border-x border-dashed border-slate-400" />
      </div>

      {/* Main Container */}
      <div className="relative pb-2 flex flex-col items-center justify-center">
        {/* Exhaust trail during refresh */}
        {isRefreshing && (
          <div className="absolute -bottom-1 flex items-center gap-5 z-0 pointer-events-none">
            <span className="w-4 h-4 rounded-full bg-slate-300/80 animate-exhaust-trail blur-[1px]" />
            <span className="w-4 h-4 rounded-full bg-slate-400/80 animate-exhaust-trail blur-[1px]" />
          </div>
        )}

        {/* The Animated Race Car (Facing Upward) */}
        <div
          className={`relative z-10 transition-transform duration-200 ${
            isLaunching
              ? 'animate-car-launch'
              : isRefreshing
              ? 'animate-car-rev'
              : isReady
              ? 'scale-105'
              : 'scale-95'
          }`}
        >
          <svg
            viewBox="0 0 100 180"
            className="w-9 h-14 drop-shadow-[0_4px_8px_rgba(11,107,79,0.3)]"
          >
            {/* Wheels */}
            <rect x="8" y="24" width="10" height="22" rx="3" fill="#0F172A" />
            <rect x="82" y="24" width="10" height="22" rx="3" fill="#0F172A" />
            <rect x="8" y="130" width="11" height="26" rx="4" fill="#0F172A" />
            <rect x="81" y="130" width="11" height="26" rx="4" fill="#0F172A" />

            {/* Aerodynamic Sports Car Body in SafarPK Emerald */}
            <path
              d="M 28 15 L 72 15 C 80 20, 86 40, 86 65 L 88 120 C 88 150, 82 165, 74 170 L 26 170 C 18 165, 12 150, 12 120 L 14 65 C 14 40, 20 20, 28 15 Z"
              fill="#0B6B4F"
            />

            {/* Hood & Racing Stripes */}
            <path d="M 36 28 L 64 28 L 58 52 L 42 52 Z" fill="#064E3B" opacity="0.8" />
            <line x1="47" y1="16" x2="47" y2="52" stroke="#FFFFFF" strokeWidth="2" opacity="0.85" />
            <line x1="53" y1="16" x2="53" y2="52" stroke="#FFFFFF" strokeWidth="2" opacity="0.85" />

            {/* Windshield & Cabin Glass */}
            <path d="M 25 58 C 25 53, 75 53, 75 58 L 71 94 C 71 100, 29 100, 29 94 Z" fill="#0F172A" />
            <path d="M 30 94 L 70 94 L 68 126 L 32 126 Z" fill="#1E293B" />
            <path d="M 32 126 L 68 126 L 65 144 L 35 144 Z" fill="#0F172A" />

            {/* Rear Spoiler */}
            <rect x="14" y="165" width="72" height="6" rx="2" fill="#064E3B" />
            <rect x="22" y="161" width="6" height="6" fill="#0F172A" />
            <rect x="72" y="161" width="6" height="6" fill="#0F172A" />

            {/* Headlights */}
            <polygon points="26,16 35,16 33,26 24,24" fill="#FEF08A" />
            <polygon points="74,16 65,16 67,26 76,24" fill="#FEF08A" />

            {/* Light Beams */}
            <path d="M 24 16 L 12 -16 L 38 -16 L 34 16 Z" fill="url(#ptrLight)" opacity={isReady || isRefreshing ? 0.8 : 0.4} />
            <path d="M 66 16 L 62 -16 L 88 -16 L 76 16 Z" fill="url(#ptrLight)" opacity={isReady || isRefreshing ? 0.8 : 0.4} />

            {/* Tail lights */}
            <rect x="22" y="170" width="18" height="3" rx="1.5" fill="#EF4444" />
            <rect x="60" y="170" width="18" height="3" rx="1.5" fill="#EF4444" />

            <defs>
              <linearGradient id="ptrLight" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Short & Clean Status Text */}
        <span className="text-[11px] font-bold text-slate-500 mt-1">
          {isRefreshing
            ? 'Refreshing...'
            : isReady
            ? 'Release'
            : 'Pull to refresh'}
        </span>
      </div>
    </div>
  );
}
