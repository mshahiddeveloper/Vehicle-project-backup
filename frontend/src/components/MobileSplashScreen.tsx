'use client';

import React, { useState, useEffect } from 'react';
import { getSiteBranding, SiteBranding } from '@/data/branding';
import { initOfflineDataCache } from '@/data/offlineCache';

export function MobileSplashScreen() {
  const [showSplash, setShowSplash] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [branding, setBranding] = useState<SiteBranding>(getSiteBranding());

  useEffect(() => {
    // Warm up offline cache in browser storage
    initOfflineDataCache();

    // Listen for branding changes
    setBranding(getSiteBranding());
    const handleBrandingChange = (e: any) => {
      setBranding(e.detail || getSiteBranding());
    };
    window.addEventListener('safarpk_branding_changed', handleBrandingChange);

    // Show splash screen on mobile launch
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      const alreadyShown = sessionStorage.getItem('safarpk_splash_shown');

      if (isMobile && !alreadyShown) {
        setShowSplash(true);
        sessionStorage.setItem('safarpk_splash_shown', 'true');

        // Start fading out after 1.2s
        const fadeTimer = setTimeout(() => {
          setIsFading(true);
        }, 1200);

        // Completely unmount after 1.6s
        const hideTimer = setTimeout(() => {
          setShowSplash(false);
        }, 1600);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(hideTimer);
          window.removeEventListener('safarpk_branding_changed', handleBrandingChange);
        };
      }
    }

    return () => {
      window.removeEventListener('safarpk_branding_changed', handleBrandingChange);
    };
  }, []);

  if (!showSplash) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-between py-12 px-6 md:hidden transition-opacity duration-400 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top spacer */}
      <div className="w-full flex justify-center pt-4">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          {branding.portalName || 'SafarPK'}
        </span>
      </div>

      {/* Center Brand Logo with subtle animation */}
      <div className="flex flex-col items-center justify-center gap-3 animate-in zoom-in-95 duration-500">
        {branding.splashLogoUrl ? (
          <img
            src={branding.splashLogoUrl}
            alt={branding.portalName || 'SafarPK'}
            className="max-h-24 w-auto max-w-[220px] object-contain drop-shadow-sm"
          />
        ) : branding.mobileLogoUrl ? (
          <img
            src={branding.mobileLogoUrl}
            alt={branding.portalName || 'SafarPK'}
            className="max-h-20 w-auto max-w-[200px] object-contain drop-shadow-sm"
          />
        ) : branding.desktopLogoUrl ? (
          <img
            src={branding.desktopLogoUrl}
            alt={branding.portalName || 'SafarPK'}
            className="max-h-16 w-auto max-w-[200px] object-contain drop-shadow-sm"
          />
        ) : (
          <>
            <div className="w-20 h-20 rounded-3xl bg-[#0B6B4F] text-white flex items-center justify-center font-heading font-black text-4xl shadow-xl shadow-emerald-950/20">
              S
            </div>
            <div className="text-center">
              <h1 className="font-heading font-black text-2xl tracking-tight text-[#101828]">
                {branding.portalName || 'SafarPK'}
              </h1>
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                Direct Mobility & Fleets
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom Loading Progress Bar */}
      <div className="flex flex-col items-center gap-2 pb-6 w-full max-w-xs">
        <div className="w-28 h-1 bg-slate-100 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 bg-[#0B6B4F] rounded-full w-full animate-pulse" />
        </div>
        <p className="text-[10px] text-slate-400 font-medium">
          Ready to move across Pakistan
        </p>
      </div>
    </div>
  );
}

