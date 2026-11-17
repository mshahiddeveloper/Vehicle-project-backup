'use client';

import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/data/offlineCache';

export function OfflineStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in slide-in-from-top-2 duration-200">
        <div className="px-3 py-1 rounded-full bg-slate-900/95 text-amber-300 border border-amber-500/50 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-[11px] sm:text-xs font-bold font-sans">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <span>Offline · Cached Mode</span>
        </div>
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in slide-in-from-top-2 fade-out duration-300">
        <div className="px-3 py-1 rounded-full bg-emerald-950/95 text-emerald-300 border border-emerald-500/50 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-[11px] sm:text-xs font-bold font-sans">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Back Online</span>
        </div>
      </div>
    );
  }

  return null;
}

