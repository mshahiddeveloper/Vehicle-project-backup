'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDown, Phone, MessageSquare, ShieldCheck, Lock } from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

export const DETAIL_PAGE_CANVAS_CLASS =
  'min-h-screen bg-[#F4F7F5] font-sans text-[#101828] flex flex-col';

export const DETAIL_CARD_CLASS =
  'rounded-[24px] bg-white border border-[#E6ECE8] p-4 sm:p-5 shadow-[0_4px_16px_rgba(16,24,40,0.04)]';

export function UnifiedHostCard({
  hostName,
  storeHref,
  subtitle = 'SafarPK Certified Fleet Partner · Replies quickly',
  shieldTitle = 'SafarPK Certified Vehicle & Host',
  shieldDescription = 'Excise smart card & host identity certified on file. Full mutual credentials unlock upon booking confirmation.',
}: {
  hostName: string;
  storeHref: string;
  subtitle?: string;
  shieldTitle?: string;
  shieldDescription?: string;
}) {
  const initials = (hostName || 'SP')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`${DETAIL_CARD_CLASS} space-y-3.5`}>
      <Link
        href={storeHref}
        className="flex items-center justify-between gap-3 group"
        title={`View ${hostName}'s Public Storefront`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-[#101828] text-white flex items-center justify-center font-heading font-extrabold text-base shrink-0 group-hover:scale-105 transition">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#101828] group-hover:text-[#0B6B4F] transition truncate">
              Hosted by {hostName}
            </h3>
            <p className="text-xs text-[#667085] truncate mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className="text-xs font-extrabold text-[#0B6B4F] shrink-0 whitespace-nowrap group-hover:underline">
          Fleet store →
        </span>
      </Link>

      <div className="p-3.5 rounded-2xl bg-[#F3F8F5] border border-[#DCE8E1] flex items-start gap-2.5 text-xs">
        <div className="w-6 h-6 rounded-full bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-[#101828]">{shieldTitle}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#DCE8E1] text-[10px] font-bold text-[#0B6B4F]">
              <Lock className="w-2.5 h-2.5" />
              Privacy shield
            </span>
          </div>
          <p className="text-[11px] text-[#475467] leading-relaxed">{shieldDescription}</p>
        </div>
      </div>
    </div>
  );
}

export function UnifiedAccordionCard({
  icon,
  title,
  subtitle,
  isOpen,
  onToggle,
  previewChips,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  previewChips?: string[];
  children: ReactNode;
}) {
  return (
    <div className="rounded-[22px] bg-white border border-[#E6ECE8] shadow-[0_4px_14px_rgba(16,24,40,0.03)] overflow-hidden transition">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-[#F9FBFA] transition cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-extrabold text-sm sm:text-base text-[#101828] truncate">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-[#667085] truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div
          className={`w-8 h-8 rounded-full bg-[#F2F4F7] text-[#344054] flex items-center justify-center shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {!isOpen && previewChips && previewChips.length > 0 && (
        <div className="px-4 sm:px-5 pb-4 -mt-1 flex flex-wrap gap-1.5">
          {previewChips.map((chip, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-full bg-[#F2F4F7] text-[#344054] text-[11px] font-semibold"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[#EEF2EF] animate-in fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

export function UnifiedMobileStickyBar({
  priceText,
  unitText,
  subText,
  onCall,
  onChat,
  onWhatsApp,
  onBook,
  bookLabel = 'Book',
  phoneTitle = 'Call Host',
}: {
  priceText: string;
  unitText?: string;
  subText?: string;
  onCall: () => void;
  onChat: () => void;
  onWhatsApp: () => void;
  onBook: () => void;
  bookLabel?: string;
  phoneTitle?: string;
}) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#101828] text-white px-4 py-3 flex items-center justify-between gap-2 shadow-[0_-8px_28px_rgba(16,24,40,0.28)] border-t border-slate-800">
      <div className="min-w-0 pr-1">
        <div className="flex items-baseline gap-1">
          <span className="font-heading font-black text-base text-white truncate">{priceText}</span>
          {unitText && <span className="text-[11px] text-slate-300 shrink-0">{unitText}</span>}
        </div>
        {subText && <span className="text-[11px] text-slate-400 block truncate">{subText}</span>}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onCall}
          title={phoneTitle}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center active:scale-95 transition cursor-pointer"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onChat}
          title="In-App Chat"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center active:scale-95 transition cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onWhatsApp}
          title="WhatsApp"
          className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center active:scale-95 transition cursor-pointer shadow-sm"
        >
          <WhatsAppIcon className="w-4.5 h-4.5 text-white" />
        </button>

        <button
          type="button"
          onClick={onBook}
          className="h-10 px-4 rounded-full bg-[#0B6B4F] hover:bg-emerald-600 text-white font-heading font-extrabold text-xs flex items-center justify-center active:scale-95 transition cursor-pointer shadow-md"
        >
          {bookLabel}
        </button>
      </div>
    </div>
  );
}

