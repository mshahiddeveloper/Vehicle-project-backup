'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getStoreSlugForOwner, slugify } from '@/data/storefrontEngine';
import { ExternalLink, Copy, Check, MessageSquare, Store, UserCheck } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  const slug = type === 'STORE' ? getStoreSlugForOwner(identifier) : slugify(identifier);
  const relativePath = type === 'STORE' ? `/store/${slug}` : `/driver/${slug}`;

  const getFullUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${relativePath}`;
    }
    return `https://safar.pk${relativePath}`;
  };

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(getFullUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleWhatsAppShare = () => {
    const fullUrl = getFullUrl();
    const message =
      type === 'STORE'
        ? `Assalam-o-Alaikum! View all our available active vehicles and transport services on SafarPK here: ${fullUrl}`
        : `Assalam-o-Alaikum! View my verified chauffeur credentials, licence categories, and hire rates on SafarPK here: ${fullUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-700 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      {/* Left Info Column */}
      <div className="space-y-3 min-w-0 flex-1">
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
            {isSubscribed ? 'Open to anyone · No login required' : '⚠️ Subscription required to go live'}
          </span>
        </div>

        {/* High-Contrast URL Display Box */}
        <div className={`flex items-center justify-between gap-3 bg-slate-950 border-2 rounded-2xl px-4 py-3 max-w-xl shadow-inner ${
          isSubscribed ? 'border-emerald-500/50' : 'border-amber-500/50'
        }`}>
          <span className={`font-mono font-black text-sm sm:text-base select-all truncate tracking-wide ${
            isSubscribed ? 'text-emerald-300' : 'text-amber-300'
          }`}>
            safar.pk{relativePath}
          </span>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${
            isSubscribed
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {isSubscribed ? 'Live URL' : 'Awaiting Subscription'}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          {!isSubscribed
            ? '⚠️ Your public storefront is currently hidden from customers. Please subscribe to an active plan to publish your live inventory.'
            : (subtitle ||
              (type === 'STORE'
                ? 'Share your dedicated store link with private clients or on WhatsApp status so customers can browse all your active vehicle listings in one single place.'
                : 'Share your public chauffeur profile with clients so they can review your licence categories, driving rates, and hire you directly.'))}
        </p>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
        <a
          href={relativePath}
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 px-4 sm:px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-extrabold transition flex items-center gap-2 shadow-md cursor-pointer"
        >
          <span>{type === 'STORE' ? 'View Store' : 'View Profile'}</span>
          <ExternalLink className="w-4 h-4 text-slate-700" />
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="h-11 px-4 sm:px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 border border-slate-600 shadow-sm cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-300" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="h-11 px-4 sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 fill-white/20" />
          <span>Share WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
