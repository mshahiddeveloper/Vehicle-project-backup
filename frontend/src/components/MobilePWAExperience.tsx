'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  X,
  Smartphone,
  Laptop,
  CheckCircle2,
  MoreVertical,
  PlusSquare,
} from 'lucide-react';

import { checkIsAppInstalled } from '@/data/offlineCache';

type DevicePlatform = 'android' | 'ios' | 'desktop';

export function MobilePWAExperience() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<DevicePlatform>('android');
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect if already installed / running in standalone mode
    const standaloneMode = checkIsAppInstalled();
    setIsStandalone(standaloneMode);
    if (standaloneMode) return;

    // 2. Check if a prompt was already captured earlier on window
    if ((window as any).__safarpk_deferred_prompt) {
      setDeferredPrompt((window as any).__safarpk_deferred_prompt);
    }

    // 3. Detect platform
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

    // 4. Register Service Worker for offline capability & PWA installability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // 5. Capture native browser install prompt (Android Chrome, Edge, Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__safarpk_deferred_prompt = e;
      setDeferredPrompt(e);
    };

    // 6. Handle app installed event: mark permanently and hide button
    const handleAppInstalled = () => {
      localStorage.setItem('safarpk_app_installed', 'true');
      setIsStandalone(true);
      (window as any).__safarpk_deferred_prompt = null;
      setDeferredPrompt(null);
      window.dispatchEvent(new Event('safarpk_app_installed'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 7. Listen for manual trigger from "Install App" button
    const handleManualInstallTrigger = () => {
      triggerInstallAction(detectedPlatform);
    };
    window.addEventListener('safarpk_trigger_pwa_install', handleManualInstallTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('safarpk_trigger_pwa_install', handleManualInstallTrigger);
    };
  }, []);

  const triggerInstallAction = async (currentPlatform: DevicePlatform) => {
    const prompt = (typeof window !== 'undefined' ? (window as any).__safarpk_deferred_prompt : null) || deferredPrompt;

    if (prompt) {
      try {
        await prompt.prompt();
        const choiceResult = await prompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          localStorage.setItem('safarpk_app_installed', 'true');
          setIsStandalone(true);
          window.dispatchEvent(new Event('safarpk_app_installed'));
        }
      } catch (err) {
        console.warn('Install error:', err);
      }
      (window as any).__safarpk_deferred_prompt = null;
      setDeferredPrompt(null);
    } else if (currentPlatform === 'ios') {
      setShowIosGuide(true);
    } else if (currentPlatform === 'android') {
      setShowAndroidGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  const handleMarkInstalledManually = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('safarpk_app_installed', 'true');
      setIsStandalone(true);
      window.dispatchEvent(new Event('safarpk_app_installed'));
    }
    setShowIosGuide(false);
    setShowAndroidGuide(false);
    setShowDesktopGuide(false);
  };

  if (isStandalone) return null;

  return (
    <>
      {/* 1. iOS INSTALL GUIDE MODAL */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#0B6B4F] text-white flex items-center justify-center text-2xl font-black shadow-md">
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
                Install Safar directly to your home screen for quick offline access:
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-[#0B6B4F] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span>
                  Tap Safari&apos;s <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-sky-600 mx-0.5" /> at the bottom.
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-[#0B6B4F] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#0B6B4F] mx-0.5" />.
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-[#0B6B4F] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top-right corner to finish.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleMarkInstalledManually}
                className="flex-1 py-2.5 bg-[#0B6B4F] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md text-center"
              >
                I Installed It ✓
              </button>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ANDROID / CHROME INSTALL GUIDE MODAL (Replaces intrusive system alert) */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#0B6B4F] text-white flex items-center justify-center text-2xl font-black shadow-md">
                S
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">Install SafarPK on Your Phone</h3>
              <p className="text-xs text-slate-600 mt-1">
                Install as a lightweight app on your home screen for instant booking & offline browsing:
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-[#0B6B4F] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span>
                  Tap the <strong>three dots</strong> (<MoreVertical className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />) in your browser menu (top right).
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-[#0B6B4F] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span>
                  Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleMarkInstalledManually}
                className="flex-1 py-2.5 bg-[#0B6B4F] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md text-center"
              >
                I Installed It ✓
              </button>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DESKTOP INSTALL GUIDE MODAL */}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#0B6B4F] text-white flex items-center justify-center text-2xl font-black shadow-md">
                S
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">Install SafarPK Desktop App</h3>
              <p className="text-xs text-slate-600 mt-1">
                Click the <strong>Install</strong> icon in the address bar (top right of browser) to add SafarPK to your desktop.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleMarkInstalledManually}
                className="flex-1 py-2.5 bg-[#0B6B4F] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md text-center"
              >
                I Installed It ✓
              </button>
              <button
                type="button"
                onClick={() => setShowDesktopGuide(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
