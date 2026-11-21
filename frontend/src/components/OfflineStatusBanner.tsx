'use client';

import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/data/offlineCache';

/**
 * In-Header Network Status Alert Bar.
 * - Sits directly below the mobile top bar and pull-refresh car inside the sticky header.
 * - Naturally in-flow: Expands and pushes content down (zero overlap).
 * - Offline: Shows black/slate background (#0F172A) with amber warning text.
 * - Reconnected: Changes background color to light emerald (#ECFDF5) with SafarPK Theme Green (#0B6B4F) text.
 * - Auto-dismisses 3.5s after connection is restored.
 */
export function OfflineStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      data-testid="offline-status-banner"
      className={`w-full relative select-none transition-all duration-200 ${
        !isOnline
          ? 'bg-[#0F172A] border-b border-slate-800 text-amber-300'
          : 'bg-emerald-50 dark:bg-[#064E3B] border-b border-emerald-300 dark:border-emerald-600 text-[#0B6B4F] dark:text-emerald-200'
      }`}
    >
      <div className="max-w-7xl mx-auto py-1.5 px-4 flex items-center justify-center gap-1.5 text-xs font-bold animate-in fade-in duration-200 text-center">
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span data-testid="offline-status-text">No internet connection</span>
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
