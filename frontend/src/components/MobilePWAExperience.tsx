'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Download,
  Share2,
  X,
  Home,
  Search,
  PlusCircle,
  Users,
  User,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { getActiveUser, RegisteredUser } from '@/data/userAuth';

interface MobilePWAExperienceProps {
  onOpenAuthModal?: () => void;
  onOpenMobileFilters?: () => void;
  currentRole?: string;
  countryName?: string;
  countryFlag?: string;
}

export function MobilePWAExperience({
  onOpenAuthModal,
  onOpenMobileFilters,
  currentRole,
  countryName = 'Pakistan',
  countryFlag = '🇵🇰',
}: MobilePWAExperienceProps) {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);

  useEffect(() => {
    // 1. Check if already running in standalone app mode
    if (typeof window !== 'undefined') {
      const isAppMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isAppMode);

      // Register service worker for fast app caching
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }

      // Listen for browser install prompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        const dismissed = localStorage.getItem('safarpk_app_prompt_dismissed');
        if (!dismissed) {
          setTimeout(() => setShowInstallBanner(true), 2500);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      setCurrentUser(getActiveUser());
      const onAuthUpdate = () => setCurrentUser(getActiveUser());
      window.addEventListener('safarpk_auth_state_changed', onAuthUpdate);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('safarpk_auth_state_changed', onAuthUpdate);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Check if iOS device
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosGuide(true);
      } else {
        alert(
          '📱 To install Safar App:\n1. Tap your browser menu (⋮ or Share icon)\n2. Select "Add to Home Screen" or "Install App".\nEnjoy fast 1-tap bookings and instant access!'
        );
      }
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem('safarpk_app_prompt_dismissed', 'true');
    } catch (e) {}
  };

  return (
    <>
      {/* 1. FLOATING INSTALL APP PROMPT CARD (Native App Style, Zero PWA Jargon) */}
      {!isStandalone && showInstallBanner && (
        <div className="fixed top-20 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                S
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-white">Install Safar App</h4>
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full uppercase">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                  Install this app on your phone for 1-tap bookings, driver WhatsApp calls, and instant vehicle search.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App on Phone</span>
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* 2. iOS INSTALL GUIDE MODAL */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-black shadow-xs">
                S
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Install Safar on iPhone & iPad
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Follow these simple steps in Safari to add the Safar App directly to your home screen:
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span>
                  Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-sky-600" /> at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>Add to Home Screen</strong> ➕.
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top right to launch full-screen from your phone anytime!
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

