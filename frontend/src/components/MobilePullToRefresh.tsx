'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function MobilePullToRefresh() {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const startYRef = useRef<number | null>(null);
  const currentPullRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);

  useEffect(() => {
    // Only activate for touch / mobile screen sizes
    if (typeof window === 'undefined') return;

    const isMobile = () => window.innerWidth < 768;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobile() || isRefreshingRef.current) return;
      // Only initiate pull-to-refresh if page is at the very top
      if (window.scrollY <= 1) {
        startYRef.current = e.touches[0].clientY;
        setIsPulling(true);
      } else {
        startYRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || isRefreshingRef.current || !isMobile()) return;
      if (window.scrollY > 1) {
        // If user scrolled down inside page, reset
        startYRef.current = null;
        setIsPulling(false);
        setPullDistance(0);
        currentPullRef.current = 0;
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0) {
        // Resistance curve so pull feels natural and elastic (max 90px)
        const distance = Math.min(92, Math.pow(diff, 0.85) * 1.4);
        currentPullRef.current = distance;
        setPullDistance(distance);

        // Prevent native bounce interference when pulling down at top
        if (distance > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        currentPullRef.current = 0;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (startYRef.current === null || isRefreshingRef.current || !isMobile()) return;
      setIsPulling(false);
      startYRef.current = null;

      const current = currentPullRef.current;

      // Threshold to trigger refresh: 58px
      if (current >= 58) {
        triggerRaceRefresh();
      } else {
        // Snap back to 0
        setPullDistance(0);
        currentPullRef.current = 0;
      }
    };

    const triggerRaceRefresh = () => {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      setPullDistance(84); // Lock gap open during race start

      // Optional subtle haptic rumble
      try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([20, 40, 60]);
        }
      } catch {}

      // Phase 1: Engine Rev for 220ms, then launch rocket
      setTimeout(() => {
        setIsLaunching(true);
      }, 220);

      // Phase 2: Page data refresh
      setTimeout(() => {
        try {
          router.refresh();
        } catch {}
      }, 550);

      // Phase 3: Smoothly close gap and reset
      setTimeout(() => {
        setPullDistance(0);
        currentPullRef.current = 0;
        setTimeout(() => {
          setIsRefreshing(false);
          setIsLaunching(false);
          isRefreshingRef.current = false;
        }, 320);
      }, 950);
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

  // If zero distance and not refreshing, render nothing
  if (pullDistance <= 0 && !isRefreshing) return null;

  const isReadyToRace = pullDistance >= 58;

  return (
    <div
      style={{
        height: `${pullDistance}px`,
        transition: isPulling ? 'none' : 'height 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)',
      }}
      className="md:hidden w-full overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-white border-b border-slate-200/80 relative flex flex-col items-center justify-end select-none pointer-events-none z-30"
    >
      {/* Background Asphalt / Speed Track Lines */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="w-16 h-full border-x border-dashed border-slate-400/60" />
      </div>

      {/* Main Container */}
      <div className="relative pb-2 flex flex-col items-center justify-center">
        {/* Exhaust Smoke Clouds on Launch */}
        {isRefreshing && (
          <div className="absolute -bottom-1 flex items-center gap-5 z-0">
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
              : isReadyToRace
              ? 'scale-105'
              : 'scale-95'
          }`}
        >
          {/* Top-Down Racing Sports Car Vector */}
          <svg
            viewBox="0 0 100 180"
            className="w-9 h-14 drop-shadow-[0_4px_8px_rgba(11,107,79,0.3)]"
          >
            {/* Wheels */}
            <rect x="8" y="24" width="10" height="22" rx="3" fill="#0F172A" />
            <rect x="82" y="24" width="10" height="22" rx="3" fill="#0F172A" />
            <rect x="8" y="130" width="11" height="26" rx="4" fill="#0F172A" />
            <rect x="81" y="130" width="11" height="26" rx="4" fill="#0F172A" />

            {/* Aerodynamic Sports Car Body Shell in SafarPK Emerald */}
            <path
              d="M 28 15 L 72 15 C 80 20, 86 40, 86 65 L 88 120 C 88 150, 82 165, 74 170 L 26 170 C 18 165, 12 150, 12 120 L 14 65 C 14 40, 20 20, 28 15 Z"
              fill="#0B6B4F"
            />

            {/* Hood Accents & Dual Racing Stripes */}
            <path d="M 36 28 L 64 28 L 58 52 L 42 52 Z" fill="#064E3B" opacity="0.8" />
            <line x1="47" y1="16" x2="47" y2="52" stroke="#FFFFFF" strokeWidth="2" opacity="0.75" />
            <line x1="53" y1="16" x2="53" y2="52" stroke="#FFFFFF" strokeWidth="2" opacity="0.75" />

            {/* Windshield & Panoramic Glass Cockpit */}
            <path d="M 25 58 C 25 53, 75 53, 75 58 L 71 94 C 71 100, 29 100, 29 94 Z" fill="#0F172A" />
            <path d="M 30 94 L 70 94 L 68 126 L 32 126 Z" fill="#1E293B" />
            {/* Rear Windshield */}
            <path d="M 32 126 L 68 126 L 65 144 L 35 144 Z" fill="#0F172A" />

            {/* Racing Rear Spoiler */}
            <rect x="14" y="165" width="72" height="6" rx="2" fill="#064E3B" />
            <rect x="22" y="161" width="6" height="6" fill="#0F172A" />
            <rect x="72" y="161" width="6" height="6" fill="#0F172A" />

            {/* Glowing Xenon Headlights */}
            <polygon points="26,16 35,16 33,26 24,24" fill="#FEF08A" />
            <polygon points="74,16 65,16 67,26 76,24" fill="#FEF08A" />

            {/* Glowing Upward Headlight Light Beams */}
            <path d="M 24 16 L 12 -16 L 38 -16 L 34 16 Z" fill="url(#headlightBeam)" opacity={isReadyToRace ? 0.8 : 0.4} />
            <path d="M 66 16 L 62 -16 L 88 -16 L 76 16 Z" fill="url(#headlightBeam)" opacity={isReadyToRace ? 0.8 : 0.4} />

            {/* Dual Red LED Taillights */}
            <rect x="22" y="170" width="18" height="3" rx="1.5" fill="#EF4444" />
            <rect x="60" y="170" width="18" height="3" rx="1.5" fill="#EF4444" />

            <defs>
              <linearGradient id="headlightBeam" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Status Prompt Label */}
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">
          {isRefreshing
            ? 'Refreshing...'
            : isReadyToRace
            ? 'Release to Race 🏎️💨'
            : 'Pull to Refresh'}
        </span>
      </div>
    </div>
  );
}

