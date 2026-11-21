'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/data/offlineCache';

/**
 * Global Network Status Alert Bar.
 * - Sits directly below the active sticky top header (or at top of page if no header).
 * - Offline: Shows black/slate background (#0F172A) with amber warning text.
 * - Reconnected: Changes background color to light emerald (#ECFDF5) with SafarPK Theme Green (#0B6B4F) text.
 * - Auto-dismisses 3.5s after connection is restored.
 */
export function OfflineStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [pullOffset, setPullOffset] = useState(0);

  useEffect(() => {
    const updateHeader = () => {
      const header = document.querySelector('header');
      if (header) {
        const rect = header.getBoundingClientRect();
        if (rect.top <= 10 && rect.height > 0) {
          setHeaderHeight(rect.height);
          return;
        }
      }
      setHeaderHeight(0);
    };

    updateHeader();
    window.addEventListener('resize', updateHeader);
    window.addEventListener('scroll', updateHeader, { passive: true });

    const handlePull = (e: any) => {
      setPullOffset(e.detail?.pullDistance || 0);
    };
    window.addEventListener('safarpk_pull_distance', handlePull);

    return () => {
      window.removeEventListener('resize', updateHeader);
      window.removeEventListener('scroll', updateHeader);
      window.removeEventListener('safarpk_pull_distance', handlePull);
    };
  }, []);

  if (isOnline && !wasOffline) {
    return null;
  }

  const currentTop = headerHeight + pullOffset;

  return (
    <div
      style={{ top: `${currentTop}px` }}
      data-testid="offline-status-banner"
      className={`fixed left-0 right-0 z-40 transition-all duration-200 select-none shadow-xs ${
        !isOnline
          ? 'bg-[#0F172A] border-b border-slate-800 text-amber-300'
          : 'bg-emerald-50 dark:bg-[#064E3B] border-b border-emerald-300 dark:border-emerald-600 text-[#0B6B4F] dark:text-emerald-200'
      }`}
    >
      <div className="max-w-7xl mx-auto py-1.5 px-4 flex items-center justify-center gap-2 text-xs font-bold animate-in fade-in duration-200">
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span data-testid="offline-status-text">No internet connection — browsing saved offline content</span>
          </>
        ) : (
          <>
            <div className="w-4 h-4 rounded-full bg-[#0B6B4F]/10 dark:bg-emerald-400/20 flex items-center justify-center shrink-0">
              <Wifi className="w-3 h-3 text-[#0B6B4F] dark:text-emerald-300" />
            </div>
            <span data-testid="online-status-text" className="font-extrabold text-[#0B6B4F] dark:text-emerald-200">
              Internet connection restored · Back online
            </span>
          </>
        )}
      </div>
    </div>
  );
}
