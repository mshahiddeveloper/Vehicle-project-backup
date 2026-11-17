'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Trash2,
  RefreshCw,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Layers,
} from 'lucide-react';
import {
  getSiteBranding,
  saveSiteBranding,
  resetSiteBranding,
  SiteBranding,
} from '@/data/branding';

export function AdminBrandingTab() {
  const [brandingState, setBrandingState] = useState<SiteBranding>(getSiteBranding());
  const [brandingSaveMsg, setBrandingSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    setBrandingState(getSiteBranding());
  }, []);

  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setBrandingState((prev) => ({
          ...prev,
          desktopLogoUrl: base64,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setBrandingState((prev) => ({
          ...prev,
          mobileLogoUrl: base64,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSplashFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setBrandingState((prev) => ({
          ...prev,
          splashLogoUrl: base64,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    saveSiteBranding(brandingState);
    setBrandingSaveMsg('✓ Logos & Branding successfully saved and applied live across all pages!');
    setTimeout(() => setBrandingSaveMsg(null), 5000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to restore the default SafarPK logo and branding?')) {
      const def = resetSiteBranding();
      setBrandingState(def);
      setBrandingSaveMsg('✓ Branding reset to system defaults!');
      setTimeout(() => setBrandingSaveMsg(null), 4000);
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-6 shadow-xl text-xs">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Portal Branding & Custom Logos</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure custom marketplace logos for Desktop Header, Mobile Top Bar, and Mobile Splash Screen. Recommended dimensions are specified for each viewport.
          </p>
        </div>
        {brandingSaveMsg && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-3.5 py-1.5 rounded-full animate-in fade-in shrink-0">
            {brandingSaveMsg}
          </span>
        )}
      </div>

      {/* Grid: 3 Logo Cards (Desktop, Mobile, Splash Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Desktop Logo Card */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  DESKTOP LOGO
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Header Bar</span>
            </div>

            {/* Size Specification */}
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 space-y-1">
              <p className="text-[11px] font-bold text-blue-300">
                📐 Recommended Dimensions:
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                <strong className="text-white">240 × 60 px</strong> (Height 40-48px).<br />
                Format: <strong className="text-white">PNG (Transparent)</strong> or <strong className="text-white">SVG</strong>.
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Live Preview:</span>
                <span className="text-[9px] font-mono text-slate-500">
                  {brandingState.desktopLogoUrl ? 'Custom' : 'Default'}
                </span>
              </label>
              <div className="p-3 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-inner">
                {brandingState.desktopLogoUrl ? (
                  <img
                    src={brandingState.desktopLogoUrl}
                    alt="Desktop Logo Preview"
                    className="h-8 w-auto max-w-[150px] object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-lg bg-[#0B6B4F] text-white flex items-center justify-center font-extrabold text-xs">
                      S
                    </span>
                    <span className="font-heading font-black text-base text-[#101828]">
                      {brandingState.portalName || 'SafarPK'}
                    </span>
                  </div>
                )}
                <span className="text-[9px] text-slate-400">🌐 PK ▾</span>
              </div>
            </div>
          </div>

          {/* Upload Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <label className="flex py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs items-center justify-center gap-2 cursor-pointer transition border border-slate-700">
              <Upload className="w-3.5 h-3.5 text-slate-300" />
              <span>Choose Desktop Logo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDesktopFileChange}
              />
            </label>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Or direct image URL..."
                value={brandingState.desktopLogoUrl}
                onChange={(e) =>
                  setBrandingState((prev) => ({
                    ...prev,
                    desktopLogoUrl: e.target.value,
                  }))
                }
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-[11px] font-mono focus:border-blue-500 focus:outline-none"
              />
              {brandingState.desktopLogoUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setBrandingState((prev) => ({ ...prev, desktopLogoUrl: '' }))
                  }
                  className="p-1.5 rounded-xl bg-slate-900 text-rose-400 hover:bg-rose-950/60 border border-rose-900/40 cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Mobile Logo Card */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  MOBILE LOGO
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Top Bar & Drawer</span>
            </div>

            {/* Size Specification */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 space-y-1">
              <p className="text-[11px] font-bold text-emerald-300">
                📐 Recommended Dimensions:
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                <strong className="text-white">160 × 48 px</strong> (or 40 × 40 px badge).<br />
                Format: <strong className="text-white">PNG (Transparent)</strong> or <strong className="text-white">SVG</strong>.
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Live Preview:</span>
                <span className="text-[9px] font-mono text-slate-500">
                  {brandingState.mobileLogoUrl ? 'Custom' : 'Fallback'}
                </span>
              </label>
              <div className="p-2.5 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-inner">
                <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
                  ☰
                </span>
                <div className="flex items-center justify-center">
                  {brandingState.mobileLogoUrl ? (
                    <img
                      src={brandingState.mobileLogoUrl}
                      alt="Mobile Logo Preview"
                      className="h-6 w-auto max-w-[120px] object-contain"
                    />
                  ) : brandingState.desktopLogoUrl ? (
                    <img
                      src={brandingState.desktopLogoUrl}
                      alt="Mobile Logo Preview"
                      className="h-6 w-auto max-w-[120px] object-contain"
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="w-5 h-5 rounded-md bg-[#0B6B4F] text-white flex items-center justify-center font-extrabold text-[10px]">
                        S
                      </span>
                      <span className="font-heading font-black text-sm text-[#101828]">
                        {brandingState.portalName || 'SafarPK'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="w-6 h-6 rounded-full bg-[#101828] text-white flex items-center justify-center text-[9px]">
                  👤
                </span>
              </div>
            </div>
          </div>

          {/* Upload Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <label className="flex py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs items-center justify-center gap-2 cursor-pointer transition border border-slate-700">
              <Upload className="w-3.5 h-3.5 text-slate-300" />
              <span>Choose Mobile Logo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMobileFileChange}
              />
            </label>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Or direct image URL..."
                value={brandingState.mobileLogoUrl}
                onChange={(e) =>
                  setBrandingState((prev) => ({
                    ...prev,
                    mobileLogoUrl: e.target.value,
                  }))
                }
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-[11px] font-mono focus:border-emerald-500 focus:outline-none"
              />
              {brandingState.mobileLogoUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setBrandingState((prev) => ({ ...prev, mobileLogoUrl: '' }))
                  }
                  className="p-1.5 rounded-xl bg-slate-900 text-rose-400 hover:bg-rose-950/60 border border-rose-900/40 cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Splash Screen Logo Card */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  SPLASH LOGO
                </span>
              </div>
              <span className="text-[10px] text-slate-400">App Launch Screen</span>
            </div>

            {/* Size Specification */}
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 space-y-1">
              <p className="text-[11px] font-bold text-amber-300">
                📐 Recommended Dimensions:
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                <strong className="text-white">200 × 200 px</strong> (Square Emblem, 1:1) or <strong className="text-white">280 × 80 px</strong>.<br />
                Format: <strong className="text-white">PNG (Transparent)</strong> or <strong className="text-white">SVG</strong>.
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Splash Screen Live Preview:</span>
                <span className="text-[9px] font-mono text-slate-500">
                  {brandingState.splashLogoUrl ? 'Custom' : 'Auto Fallback'}
                </span>
              </label>
              <div className="p-3 h-16 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-inner relative">
                {brandingState.splashLogoUrl ? (
                  <img
                    src={brandingState.splashLogoUrl}
                    alt="Splash Logo Preview"
                    className="h-8 w-auto max-w-[140px] object-contain drop-shadow-xs"
                  />
                ) : brandingState.mobileLogoUrl ? (
                  <img
                    src={brandingState.mobileLogoUrl}
                    alt="Splash Logo Preview"
                    className="h-7 w-auto max-w-[130px] object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-[#0B6B4F] text-white flex items-center justify-center font-extrabold text-xs">
                      S
                    </span>
                    <span className="font-heading font-black text-sm text-[#101828]">
                      {brandingState.portalName || 'SafarPK'}
                    </span>
                  </div>
                )}
                <div className="w-16 h-0.5 bg-emerald-600 rounded-full mt-1.5 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Upload Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <label className="flex py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs items-center justify-center gap-2 cursor-pointer transition border border-slate-700">
              <Upload className="w-3.5 h-3.5 text-slate-300" />
              <span>Choose Splash Logo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSplashFileChange}
              />
            </label>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Or direct image URL..."
                value={brandingState.splashLogoUrl}
                onChange={(e) =>
                  setBrandingState((prev) => ({
                    ...prev,
                    splashLogoUrl: e.target.value,
                  }))
                }
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-[11px] font-mono focus:border-amber-500 focus:outline-none"
              />
              {brandingState.splashLogoUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setBrandingState((prev) => ({ ...prev, splashLogoUrl: '' }))
                  }
                  className="p-1.5 rounded-xl bg-slate-900 text-rose-400 hover:bg-rose-950/60 border border-rose-900/40 cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Portal Name & Global Settings */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="font-extrabold text-sm text-white">General Marketplace Title</span>
          <span className="text-[11px] text-slate-400">Used when text fallback logo is rendered</span>
        </div>
        <div className="max-w-md">
          <label className="text-[11px] font-bold text-slate-400 block mb-1">
            Portal Brand Name:
          </label>
          <input
            type="text"
            value={brandingState.portalName}
            onChange={(e) =>
              setBrandingState((prev) => ({
                ...prev,
                portalName: e.target.value,
              }))
            }
            placeholder="e.g. SafarPK"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={handleReset}
          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Restore Default Brand & Logos</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
        >
          <Save className="w-4 h-4" />
          <span>Save & Apply Logos Live</span>
        </button>
      </div>
    </div>
  );
}
