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
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Listen for manual trigger from "Install App" button in sidebar menu
    const handleManualInstallTrigger = () => {
      triggerInstallAction(detectedPlatform);
    };
    window.addEventListener('safarpk_trigger_pwa_install', handleManualInstallTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('safarpk_trigger_pwa_install', handleManualInstallTrigger);
    };
  }, []);

  const triggerInstallAction = async (currentPlatform: DevicePlatform) => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } catch (err) {}
      setDeferredPrompt(null);
    } else if (currentPlatform === 'ios') {
      setShowIosGuide(true);
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

  if (isStandalone) return null;

  return (
    <>
      {/* 1. iOS INSTALL GUIDE MODAL (User-triggered only) */}
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
