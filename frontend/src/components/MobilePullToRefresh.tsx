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

      // Only prepare pull if page is at the very top (within 4px)
      if (getScrollTop() <= 4) {
        startXRef.current = e.touches[0].clientX;
        startYRef.current = e.touches[0].clientY;
      } else {
        startXRef.current = null;
        startYRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // If no valid start touch or currently refreshing, let native scroll take over
      if (startYRef.current === null || isRefreshingRef.current || !isMobile()) return;

      const currentScroll = getScrollTop();
      if (currentScroll > 4) {
        // User is scrolled down the page: immediately disengage pull-to-refresh
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

      // CRITICAL FOR SMOOTH DOWNWARD SCROLLING:
      // If user swipes UP (diffY < 0), they are trying to scroll DOWN into the page!
      // Invalidate startYRef immediately so native browser scrolling takes over with zero interference!
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

      // If horizontal gesture is dominant (e.g. car cards carousel swipe), cancel pull
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

      // Only lock into pull-to-refresh if pulling down more than 10px vertically
      if (diffY > 10) {
        if (e.cancelable) {
          e.preventDefault();
        }

        // Spacious and elastic resistance curve up to 145px
        const distance = Math.min(145, Math.pow(diffY, 0.88) * 1.55);
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

      // Trigger threshold: 72px gives clear, intentional pull feedback
      if (current >= 72) {
        triggerRaceRefresh();
      } else if (current > 0) {
        // Snap back smoothly
        currentPullRef.current = 0;
        setPullDistance(0);
      }
    };

    const triggerRaceRefresh = () => {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      setIsLaunching(false);
      // Spacious lock height (125px) so user can clearly see highway, speed lines, and car racing!
      setPullDistance(125);

      // Subtle haptic vibration
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([25, 45, 65]);
        }
      } catch {}

      // Fast priority refresh: trigger router refresh and notify components
      try {
        router.refresh();
        window.dispatchEvent(new CustomEvent('safarpk_pull_refresh'));
      } catch {}

      // Keep car running with high speed road lines for ~750ms so user clearly sees the race
      setTimeout(() => {
        // Rocket launch forward off top of screen
        setIsLaunching(true);

        // Smoothly close track height to 0 as car exits
        setTimeout(() => {
          setPullDistance(0);
          currentPullRef.current = 0;

          // Full reset and restore complete native scrollability
          setTimeout(() => {
            setIsRefreshing(false);
            setIsLaunching(false);
            isRefreshingRef.current = false;
          }, 350);
        }, 400);
      }, 850);
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

  // If closed and not refreshing, render nothing
  if (pullDistance <= 0 && !isRefreshing) return null;

  const isReadyToRace = pullDistance >= 72;

  return (
    <div
      style={{
        height: `${pullDistance}px`,
        transition: isPulling
          ? 'none'
          : 'height 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="md:hidden w-full overflow-hidden bg-[#0F172A] border-b border-slate-700/80 relative flex flex-col items-center justify-end select-none pointer-events-none z-30 shadow-inner"
    >
      {/* Highway Asphalt Road Surface */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090D16] via-[#0F172A] to-[#1E293B]" />

      {/* Dual Highway Curbs / Guardrails */}
      <div className="absolute inset-y-0 left-3 w-1.5 bg-gradient-to-b from-amber-500/30 via-amber-400/50 to-amber-500/30 border-r border-amber-300/40" />
      <div className="absolute inset-y-0 right-3 w-1.5 bg-gradient-to-b from-amber-500/30 via-amber-400/50 to-amber-500/30 border-l border-amber-300/40" />

      {/* Center White Dashed Highway Speed Markings */}
      <div
        className={`absolute inset-0 flex justify-center pointer-events-none ${
          isRefreshing ? 'animate-road-speed' : ''
        }`}
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #FFFFFF 0px, #FFFFFF 18px, transparent 18px, transparent 36px)',
          backgroundSize: '3px 36px',
          backgroundPosition: 'center 0',
          opacity: 0.35,
        }}
      />

      {/* Speed Dust / Motion Blur Streaks on Sides */}
      {isRefreshing && (
        <>
          <div className="absolute inset-y-0 left-12 w-0.5 bg-emerald-400/30 animate-pulse" />
          <div className="absolute inset-y-0 right-12 w-0.5 bg-emerald-400/30 animate-pulse" />
        </>
      )}

      {/* Car & Status Container */}
      <div className="relative pb-2.5 flex flex-col items-center justify-center z-10 w-full max-w-xs">
        {/* Exhaust Turbo Smoke Clouds during Engine Rev / Launch */}
        {isRefreshing && (
          <div className="absolute bottom-5 flex items-center gap-6 z-0 pointer-events-none">
            <span className="w-5 h-5 rounded-full bg-slate-300/60 animate-exhaust-trail blur-[2px]" />
            <span className="w-6 h-6 rounded-full bg-emerald-400/40 animate-exhaust-trail blur-[2px]" />
          </div>
        )}

        {/* The Animated Race Car (Facing Upward towards destination) */}
        <div
          className={`relative z-10 transition-transform duration-200 ${
            isLaunching
              ? 'animate-car-launch'
              : isRefreshing
              ? 'animate-car-rev'
              : isReadyToRace
              ? 'scale-110'
              : 'scale-100'
          }`}
        >
          {/* Top-Down Racing Sports Car Vector */}
          <svg
            viewBox="0 0 100 180"
            className="w-10 h-16 drop-shadow-[0_6px_12px_rgba(11,107,79,0.5)]"
          >
            {/* Front & Rear Racing Tires with Deep Rims */}
            <rect x="7" y="24" width="11" height="24" rx="3" fill="#020617" stroke="#334155" strokeWidth="1" />
            <rect x="82" y="24" width="11" height="24" rx="3" fill="#020617" stroke="#334155" strokeWidth="1" />
            <rect x="6" y="128" width="13" height="28" rx="4" fill="#020617" stroke="#334155" strokeWidth="1" />
            <rect x="81" y="128" width="13" height="28" rx="4" fill="#020617" stroke="#334155" strokeWidth="1" />

            {/* Aerodynamic Sports Body Shell in SafarPK Emerald */}
            <path
              d="M 28 14 L 72 14 C 82 20, 88 42, 88 68 L 90 122 C 90 152, 84 168, 75 172 L 25 172 C 16 168, 10 152, 10 122 L 12 68 C 12 42, 18 20, 28 14 Z"
              fill="#0B6B4F"
              stroke="#047857"
              strokeWidth="1.5"
            />

            {/* Racing Hood Inset */}
            <path d="M 35 26 L 65 26 L 59 52 L 41 52 Z" fill="#064E3B" />

            {/* Dual White Racing Stripes Along Center */}
            <line x1="46" y1="15" x2="46" y2="52" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.9" />
            <line x1="54" y1="15" x2="54" y2="52" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.9" />

            {/* Dark Panoramic Glass Cockpit */}
            <path d="M 24 58 C 24 52, 76 52, 76 58 L 72 96 C 72 102, 28 102, 28 96 Z" fill="#0F172A" stroke="#1E293B" strokeWidth="1" />
            {/* Interior Roof Panel */}
            <path d="M 30 96 L 70 96 L 68 128 L 32 128 Z" fill="#1E293B" />
            {/* Rear Glass Window */}
            <path d="M 32 128 L 68 128 L 65 146 L 35 146 Z" fill="#0F172A" />

            {/* High-Downforce Rear GT Wing Spoiler */}
            <rect x="12" y="166" width="76" height="7" rx="2" fill="#064E3B" stroke="#047857" strokeWidth="1" />
            <rect x="20" y="161" width="7" height="6" fill="#0F172A" />
            <rect x="73" y="161" width="7" height="6" fill="#0F172A" />

            {/* Glowing Xenon Headlights */}
            <polygon points="25,16 36,16 34,27 23,25" fill="#FEF08A" />
            <polygon points="75,16 64,16 66,27 77,25" fill="#FEF08A" />

            {/* High-Beam Forward Xenon Light Cones */}
            <path d="M 24 16 L 8 -24 L 38 -24 L 34 16 Z" fill="url(#ptrHeadlightBeam)" opacity={isRefreshing ? 0.95 : isReadyToRace ? 0.8 : 0.45} />
            <path d="M 66 16 L 62 -24 L 92 -24 L 76 16 Z" fill="url(#ptrHeadlightBeam)" opacity={isRefreshing ? 0.95 : isReadyToRace ? 0.8 : 0.45} />

            {/* Dual Red Tail Lights */}
            <rect x="20" y="171" width="20" height="3" rx="1.5" fill="#EF4444" />
            <rect x="60" y="171" width="20" height="3" rx="1.5" fill="#EF4444" />

            <defs>
              <linearGradient id="ptrHeadlightBeam" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#67E8F9" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#67E8F9" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Status Prompt Label with Badge */}
        <div className="mt-1.5 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/50 border border-slate-700/60 backdrop-blur-xs">
          <span className="text-[11px] font-black tracking-wide text-white">
            {isRefreshing ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Updating SafarPK Listings... 🏎️💨
              </span>
            ) : isReadyToRace ? (
              <span className="text-amber-300 font-extrabold animate-pulse">
                Release to Race! 🏁
              </span>
            ) : (
              <span className="text-slate-300 font-bold">
                Pull down to refresh ⬇
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
