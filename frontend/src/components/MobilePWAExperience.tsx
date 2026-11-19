'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  X,
  Smartphone,
  Laptop,
  Apple,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

type DevicePlatform = 'android' | 'ios' | 'desktop';

export function MobilePWAExperience() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<DevicePlatform>('android');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect if already installed / running in standalone window
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);
    if (standaloneMode) return;

    // 2. Detect platform without saying PWA
    const ua = navigator.userAgent || '';
    const isIosDevice =
      (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /Android/i.test(ua);

    let detectedPlatform: DevicePlatform = 'desktop';
    if (isAndroidDevice) detectedPlatform = 'android';
    else if (isIosDevice) detectedPlatform = 'ios';
    else detectedPlatform = 'desktop';
    setPlatform(detectedPlatform);

    // 3. Register Service Worker for offline capability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // 4. Capture native browser install prompt (Android Chrome, Edge, Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      checkAndShowPrompt(detectedPlatform);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS or if prompt hasn't fired yet, check session dismissal and display prompt
    checkAndShowPrompt(detectedPlatform);

    // 5. Listen for manual trigger from "Install App" buttons across the website
    const handleManualInstallTrigger = () => {
      triggerInstallAction(detectedPlatform);
    };
    window.addEventListener('safarpk_trigger_pwa_install', handleManualInstallTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('safarpk_trigger_pwa_install', handleManualInstallTrigger);
    };
  }, []);

  const checkAndShowPrompt = (devPlatform: DevicePlatform) => {
    try {
      if (devPlatform === 'desktop') {
        const desktopDismissed = sessionStorage.getItem('safarpk_desktop_install_dismissed');
        if (!desktopDismissed) {
          setTimeout(() => setShowPrompt(true), 3500);
        }
      } else {
        // Mobile (Android / iOS): show on every new visit/session, dismissable per session
        const mobileDismissed = sessionStorage.getItem('safarpk_mobile_install_dismissed');
        if (!mobileDismissed) {
          setTimeout(() => setShowPrompt(true), 2500);
        }
      }
    } catch (e) {
      setTimeout(() => setShowPrompt(true), 3000);
    }
  };

  const triggerInstallAction = async (currentPlatform: DevicePlatform) => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setShowPrompt(false);
        }
      } catch (err) {}
      setDeferredPrompt(null);
    } else if (currentPlatform === 'ios') {
      setShowIosGuide(true);
      setShowPrompt(false);
    } else if (currentPlatform === 'android') {
      // Guide for Android if prompt was already consumed
      alert(
        '📱 To install Safar App:\n1. Tap the three dots (⋮) in your Chrome browser menu.\n2. Tap "Install app" or "Add to Home screen".'
      );
    } else {
      // Desktop fallback
      alert(
        '💻 To install Safar App on your computer:\n1. Click the Install icon in the browser address bar (top right)\n2. Click "Install" to add to desktop.'
      );
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    try {
      if (platform === 'desktop') {
        sessionStorage.setItem('safarpk_desktop_install_dismissed', 'true');
      } else {
        sessionStorage.setItem('safarpk_mobile_install_dismissed', 'true');
      }
    } catch (e) {}
  };

  if (isStandalone) return null;

  const appName =
    platform === 'android' ? 'Android App' : platform === 'ios' ? 'iOS App' : 'Desktop App';

  const installButtonText =
    platform === 'android'
      ? 'Install Android App'
      : platform === 'ios'
      ? 'Install for iPhone'
      : 'Install Desktop App';

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. INSTALL APP POPUP (DESKTOP: BOTTOM-LEFT, MOBILE: CENTER-TOP)           */}
      {/* ========================================================================= */}
      {showPrompt && (
        <div
          className={`fixed z-[99999] transition-all duration-300 ease-out ${
            platform === 'desktop'
              ? 'bottom-5 left-5 max-w-sm w-full animate-in slide-in-from-bottom-4'
              : 'top-14 left-1/2 -translate-x-1/2 w-[92%] max-w-sm animate-in slide-in-from-top-3'
          }`}
        >
          <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                  S
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-xs text-white">Safar {appName}</h4>
                    <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full uppercase">
                      Official
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                    {platform === 'desktop'
                      ? 'Install on your computer for fast access and instant vehicle search.'
                      : 'Install on your phone for 1-tap bookings, WhatsApp calls, and offline access.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissPrompt}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => triggerInstallAction(platform)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{installButtonText}</span>
              </button>
              <button
                type="button"
                onClick={dismissPrompt}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. iOS INSTALL GUIDE MODAL                                                */}
      {/* ========================================================================= */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
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
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">Install Safar on iPhone & iPad</h3>
              <p className="text-xs text-slate-600 mt-1">
                Follow these simple steps in Safari to add Safar directly to your home screen:
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span>
                  Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-sky-600 mx-0.5" /> at
                  the bottom of Safari.
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
                  Tap <strong>Add</strong> in the top right to use Safar anytime full-screen!
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
