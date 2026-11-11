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
    // 1. Check if already installed / running in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isPwa =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isPwa);

      // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }

      // Listen for beforeinstallprompt event
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Show banner after 2 seconds if not dismissed
        const dismissed = localStorage.getItem('safarpk_pwa_banner_dismissed');
        if (!dismissed) {
          setTimeout(() => setShowInstallBanner(true), 2000);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      // Load active user
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
      // Check if iOS
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosGuide(true);
      } else {
        alert(
          '📱 To install SafarPK App:\n1. Tap your browser menu (⋮ or Share icon)\n2. Select "Add to Home Screen" or "Install App".\nEnjoy fast 1-tap bookings and offline access!'
        );
      }
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem('safarpk_pwa_banner_dismissed', 'true');
    } catch (e) {}
  };

  const getDashboardLink = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'LISTER') return '/lister';
    if (currentUser.role === 'DRIVER') return '/driver';
    if (currentUser.role === 'PROVIDER') {
      return currentUser.providerSubtype === 'PICK_AND_DROP'
        ? '/provider?mode=pick_and_drop'
        : '/provider?mode=commercial_cargo';
    }
    return '/customer';
  };

  return (
    <>
      {/* 1. TOP PWA DOWNLOAD / INSTALL FLOATING PROMPT BANNER */}
      {!isStandalone && showInstallBanner && (
        <div className="fixed top-18 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                S
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-white">Download SafarPK App</h4>
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full uppercase">
                    PWA App
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                  Fast 1-tap bookings, driver WhatsApp calls, and offline access.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Mobile App Now</span>
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
                Install SafarPK on iPhone & iPad
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Follow these simple steps in Safari to add the SafarPK App directly to your home screen:
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
                  Tap <strong>Add</strong> in the top right. Enjoy full-screen native app experience!
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

      {/* 3. NATIVE MOBILE APP BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex justify-around items-center shadow-lg safe-area-bottom">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            pathname === '/' ? 'text-emerald-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-semibold'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>

        {/* Search / Filters */}
        <button
          type="button"
          onClick={onOpenMobileFilters || (() => window.scrollTo({ top: 350, behavior: 'smooth' }))}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Filter Cars</span>
        </button>

        {/* Post Ad / Add Car (Center Highlighted Pill) */}
        <Link
          href="/lister?tab=add_vehicle"
          className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white w-12 h-12 rounded-full shadow-lg shadow-emerald-600/30 hover:scale-105 transition cursor-pointer"
        >
          <PlusCircle className="w-6 h-6" />
        </Link>

        {/* Drivers */}
        <Link
          href="/driver"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            pathname === '/driver' ? 'text-emerald-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-semibold'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Drivers</span>
        </Link>

        {/* Account / Dashboard */}
        {currentUser ? (
          <Link
            href={getDashboardLink() || '/customer'}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
              pathname.includes('/lister') || pathname.includes('/driver') || pathname.includes('/provider') || pathname.includes('/customer')
                ? 'text-emerald-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-[10px] truncate max-w-[60px]">{currentUser.role === 'LISTER' ? 'Fleet' : 'Portal'}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Sign In</span>
          </button>
        )}
      </nav>
    </>
  );
}
