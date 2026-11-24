'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getStoreSlugForOwner, slugify, getStoreSecureToken } from '@/data/storefrontEngine';
import { ExternalLink, Copy, Check, MessageSquare, Store, UserCheck, ShieldCheck, Key } from 'lucide-react';

interface DashboardStoreWidgetProps {
  type: 'STORE' | 'DRIVER';
  identifier: string;
  subtitle?: string;
  isSubscribed?: boolean;
}

export function DashboardStoreWidget({
  type,
  identifier,
  subtitle,
  isSubscribed = true,
}: DashboardStoreWidgetProps) {
  const [copiedType, setCopiedType] = useState<'vanity' | 'secure' | null>(null);

  const slug = type === 'STORE' ? getStoreSlugForOwner(identifier) : slugify(identifier);
  const secureToken = getStoreSecureToken(identifier);
  const vanityPath = type === 'STORE' ? `/store/${slug}` : `/driver/${slug}`;
  const securePath = type === 'STORE' ? `/store/${secureToken}` : `/driver/${secureToken}`;

  const getFullUrl = (path: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`;
    }
    return `https://safar.pk${path}`;
  };

  const handleCopy = (which: 'vanity' | 'secure') => {
    try {
      const url = getFullUrl(which === 'vanity' ? vanityPath : securePath);
      navigator.clipboard.writeText(url);
      setCopiedType(which);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {}
  };

  const handleWhatsAppShare = () => {
    const fullUrl = getFullUrl(vanityPath);
    const message =
      type === 'STORE'
        ? `Assalam-o-Alaikum! View all our available active vehicles and transport services on SafarPK here: ${fullUrl}`
        : `Assalam-o-Alaikum! View my verified chauffeur credentials, licence categories, and hire rates on SafarPK here: ${fullUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-700 shadow-xl flex flex-col gap-6">
      {/* Top Header & Badge Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs border ${
            isSubscribed
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
          }`}>
            {type === 'STORE' ? <Store className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            <span>{type === 'STORE' ? 'Public Fleet Storefront' : 'Public Driver Profile'}</span>
          </span>
          <span className="text-xs text-slate-300 font-medium">
            {isSubscribed ? '● Active & Live Online' : '⚠️ Hidden · Subscription Required'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={vanityPath}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>{type === 'STORE' ? 'Preview Store' : 'Preview Profile'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-700" />
          </a>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
            <span>Share WhatsApp</span>
          </button>
        </div>
      </div>

      {/* URLs Row (Vanity URL + Encrypted Secure URL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vanity URL Card */}
        <div className={`p-4 rounded-2xl bg-slate-950 border flex flex-col justify-between gap-3 ${
          isSubscribed ? 'border-emerald-500/40' : 'border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                Custom Vanity URL
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Public</span>
            </div>
            <div className="font-mono text-sm text-emerald-300 font-bold truncate select-all">
              safar.pk{vanityPath}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy('vanity')}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer w-full"
          >
            {copiedType === 'vanity' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Vanity Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Copy Custom Link</span>
              </>
            )}
          </button>
        </div>

        {/* Encrypted Secure Token URL Card */}
        <div className={`p-4 rounded-2xl bg-slate-950 border flex flex-col justify-between gap-3 ${
          isSubscribed ? 'border-blue-500/40' : 'border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                Encrypted Secure Link
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Protected</span>
            </div>
            <div className="font-mono text-sm text-blue-300 font-bold truncate select-all">
              safar.pk{securePath}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy('secure')}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer w-full"
          >
            {copiedType === 'secure' ? (
              <>
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-300">Secure Token Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Copy Encrypted Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subscription Status Message / Guide */}
      <div className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
        isSubscribed
          ? 'bg-slate-950/60 border-slate-800 text-slate-300'
          : 'bg-amber-950/30 border-amber-600/40 text-amber-200'
      }`}>
        {!isSubscribed ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="block text-amber-300 font-extrabold text-sm mb-0.5">
                ⚠️ Storefront & Fleet Listings Offline (Subscription Inactive)
              </strong>
              Your public storefront and vehicle listings are currently hidden from prospective customers because your subscription plan is inactive or pending renewal.
            </div>
            <Link
              href="/subscription"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shrink-0 text-center transition"
            >
              Activate Plan Now
            </Link>
          </div>
        ) : (
          <p className="text-slate-300">
            {subtitle ||
              (type === 'STORE'
                ? 'Share your dedicated store link or encrypted token with private clients and on WhatsApp status so customers can browse all your active vehicle listings in one single verified place.'
                : 'Share your public chauffeur profile with clients so they can review your licence categories, driving rates, and hire you directly.')}
          </p>
        )}
      </div>
    </div>
  );
}
