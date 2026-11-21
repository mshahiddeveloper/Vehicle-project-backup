'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { MOVERS_DATA, MoverItem } from '@/data/marketplaceData';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import { Phone, MessageSquare, Truck, ArrowRight, ShieldCheck, Check, Search, ChevronDown, Eye, CheckCircle2 } from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

export default function MoversPage() {
  const [sizeFilter, setSizeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [selectedMoverId, setSelectedMoverId] = useState<string>(MOVERS_DATA[0].id);
  const [estimatedKm, setEstimatedKm] = useState<number>(15);
  const [helpersCount, setHelpersCount] = useState<number>(2);
  const [movers, setMovers] = useState<MoverItem[]>(MOVERS_DATA);

  const selectedMover = movers.find((m) => m.id === selectedMoverId) || movers[0];

  // Dynamic cost calculations matching mover rates
  const kmRateNum = parseInt(selectedMover.km.replace(/\D/g, ''), 10) || 120;
  const helperRateNum = parseInt(selectedMover.helper.replace(/\D/g, ''), 10) || 1000;
  const estimatedCost = selectedMover.baseNum + estimatedKm * kmRateNum + helpersCount * helperRateNum;

  const filteredMovers = movers.filter((m) => {
    if (sizeFilter !== 'ALL' && m.category !== sizeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        m.name.toLowerCase().includes(q) ||
        m.trucks.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleWhatsApp = (mover: MoverItem) => {
    setSelectedMoverId(mover.id);
    recordLead({
      listingId: mover.id,
      listingTitle: `Home Shifting: ${mover.name}`,
      listerPhone: mover.phone,
      type: 'WHATSAPP_CLICK',
    });
    recordClickEvent(mover.id, 'WHATSAPP');

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const moverUrl = `${origin}/movers/${mover.id}`;
    const rawMsg = `Hi, I would like to hire cargo shifting logistics with ${mover.name} on SafarPK: Category: ${mover.category} Truck: ${mover.trucks} Distance: ~${estimatedKm} km Helpers: ${helpersCount} Estimated Cost: Rs. ${estimatedCost.toLocaleString('en-US')} Details: ${moverUrl}`;
    window.open(getWhatsAppTargetUrl(mover.whatsapp || mover.phone, rawMsg), '_blank');
  };

  const handleCall = (mover: MoverItem) => {
    setSelectedMoverId(mover.id);
    setRevealedPhones((prev) => ({ ...prev, [mover.id]: true }));
    recordLead({
      listingId: mover.id,
      listingTitle: `Home Shifting: ${mover.name}`,
      listerPhone: mover.phone,
      type: 'CALL_CLICK',
    });
    recordClickEvent(mover.id, 'CALL');
    if (revealedPhones[mover.id]) {
      window.location.href = `tel:${mover.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleSendMove = (mover?: MoverItem) => {
    const target = mover || selectedMover;
    setSelectedMoverId(target.id);

    recordLead({
      listingId: target.id,
      listingTitle: `Move Request to ${target.name}`,
      listerPhone: target.phone,
      type: 'BOOKING_REQUEST',
    });
    recordClickEvent(target.id, 'BOOKING');

    const ref = `SF-${Math.floor(10000 + Math.random() * 90000)}`;

    setMovers((prev) =>
      prev.map((m) =>
        m.id === target.id ? { ...m, contacted: '✓ You sent a request · Today' } : m
      )
    );

    window.location.href = `/request-sent?type=movers&ref=${ref}&name=${encodeURIComponent(
      target.name
    )}&rate=${encodeURIComponent(`Rs. ${estimatedCost.toLocaleString('en-US')}`)}&route=${encodeURIComponent(
      `${target.city} (~${estimatedKm} km, ${helpersCount} helpers)`
    )}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start pb-32 sm:pb-12">
        {/*
          RESPONSIVE ORDERING:
          On mobile (< lg): Calculator is order-1 (at the very TOP of the page for instant access).
          On desktop (>= lg): Calculator is order-2 (sticky right column).
        */}
        <aside className="order-1 lg:order-2 relative lg:sticky lg:top-24 border border-orange-200/90 rounded-3xl p-5 sm:p-6 bg-white shadow-lg space-y-4">
          {/* Header with Title and Category Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              INSTANT SHIFTING CALCULATOR
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[11px] font-bold">
              {selectedMover.category}
            </span>
          </div>

          {/* Selected Mover Callout */}
          <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600 shrink-0">Selected Mover:</span>
            <span className="text-xs font-extrabold text-[#9A3412] truncate text-right" title={selectedMover.name}>
              {selectedMover.name}
            </span>
          </div>

          {/* Distance Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>Trip Distance: <strong className="text-[#C2410C] font-extrabold text-sm">{estimatedKm} km</strong></span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={estimatedKm}
              onChange={(e) => setEstimatedKm(parseInt(e.target.value, 10))}
              className="w-full accent-[#C2410C] cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>5 km (Local)</span>
              <span>50 km</span>
              <span>100 km (Intercity)</span>
            </div>
          </div>

          {/* Helpers / Loaders Stepper (Unlimited + Quick Presets) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>Loaders / Helpers</span>
              <span className="font-extrabold text-xs text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                {helpersCount === 0 ? 'No helpers (Truck only)' : `${helpersCount} ${helpersCount === 1 ? 'helper' : 'helpers'}`}
              </span>
            </div>

            {/* Stepper with Controls + Preset Pills */}
            <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
              {/* Stepper Counter */}
              <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setHelpersCount((prev) => Math.max(0, prev - 1))}
                  disabled={helpersCount <= 0}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-black text-sm hover:bg-orange-50 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                  title="Decrease helper"
                >
                  –
                </button>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={helpersCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setHelpersCount(isNaN(val) ? 0 : Math.max(0, Math.min(100, val)));
                  }}
                  className="w-10 h-7 text-center bg-white border border-slate-200 rounded-lg font-heading font-black text-xs text-slate-900 outline-none focus:border-[#C2410C]"
                  title="Enter any number of helpers"
                />
                <button
                  type="button"
                  onClick={() => setHelpersCount((prev) => prev + 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-black text-sm hover:bg-orange-50 hover:text-orange-700 transition cursor-pointer shadow-2xs"
                  title="Increase helper (No limit)"
                >
                  +
                </button>
              </div>

              {/* Fast Presets: 1, 2, 4, 6 */}
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setHelpersCount(num)}
                    className={`h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                      helpersCount === num
                        ? 'bg-[#C2410C] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Estimated Shifting Total Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-orange-50/80 to-amber-50/40 border border-orange-200 text-center space-y-1 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-orange-900 uppercase">
              ESTIMATED SHIFTING TOTAL
            </span>
            <div className="font-heading font-black text-3xl sm:text-4xl text-[#9A3412]">
              Rs {estimatedCost.toLocaleString('en-US')}
            </div>
            <p className="text-[11px] sm:text-xs text-[#C2410C] font-medium">
              Base {selectedMover.base} + {estimatedKm}km (Rs. {kmRateNum}/km) + {helpersCount} helpers
            </p>
          </div>

          {/* Contact Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Instant WhatsApp Button */}
            <button
              type="button"
              onClick={() => handleWhatsApp(selectedMover)}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
              <span>WhatsApp</span>
            </button>

            {/* Direct Call Button with Click-to-Reveal Pattern */}
            <button
              type="button"
              onClick={() => handleCall(selectedMover)}
              className="w-full h-10 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100 text-[#9A3412] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-[0.99]"
              title={revealedPhones[selectedMover.id] ? `Call ${selectedMover.name}` : 'Click to show phone number'}
            >
              <Phone className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>
                {revealedPhones[selectedMover.id] ? (
                  <>Call Host: <span className="font-mono font-bold">{selectedMover.phone}</span></>
                ) : (
                  'Show Phone Number'
                )}
              </span>
            </button>

            {/* Request Move Button */}
            <button
              type="button"
              onClick={() => handleSendMove(selectedMover)}
              className="w-full h-10 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span>Send Move Request to {selectedMover.name.split(' ')[0]}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>

        {/*
          Listings Column:
          order-2 on mobile (< lg), order-1 on desktop (>= lg).
        */}
        <div className="order-2 lg:order-1 flex flex-col gap-6">
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <h1 className="font-heading font-extrabold text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-tight text-[#101828] leading-tight">
              Home shifting & movers
            </h1>
            <p className="text-[#475467] text-xs sm:text-sm md:text-base leading-relaxed">
              Trucks with helpers for house, office or single heavy items. Compare quotes and book directly.
            </p>
          </div>

          {/* Search & Filter Controls: Single-Row Robust Responsive Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Live Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search movers by company, truck or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Truck Size / Category Dropdown */}
            <div className="relative w-full sm:w-64 shrink-0">
              <select
                aria-label="Filter by truck size"
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition shadow-2xs appearance-none cursor-pointer"
              >
                <option value="ALL">All Truck Sizes & Categories</option>
                <option value="Suzuki Ravi (Mini)">Suzuki Ravi (1 Ton / Mini)</option>
                <option value="Shehzore (2.5 Ton)">Hyundai Shehzore (2.5 Ton)</option>
                <option value="Mazda (14-17ft)">Mazda Titan (14-17ft / 5 Ton)</option>
                <option value="Office Relocation">Office Relocation & Cargo</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-[#667085]">
            <span>Showing {filteredMovers.length} verified moving services</span>
            <span>Click any mover to calculate customized quote</span>
          </div>

          {/* Mover Cards */}
          <div className="flex flex-col gap-4">
            {filteredMovers.map((m) => {
              const isSelected = selectedMoverId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMoverId(m.id)}
                  className={`rounded-[22px] p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[96px_1fr_auto] gap-5 items-center transition cursor-pointer ${
                    isSelected
                      ? 'border-2 border-orange-500 bg-[#FFF7ED] shadow-md ring-1 ring-orange-500/20'
                      : 'border border-[#EEF0F2] bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Truck Icon Art */}
                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 transition bg-[#FDECE4] text-[#C2410C]">
                    <Truck className="w-12 h-12 stroke-[1.6]" />
                  </div>

                  {/* Company Details */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/movers/${m.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-heading font-extrabold text-lg text-[#101828] hover:text-[#C2410C] transition"
                      >
                        {m.name}
                      </Link>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EEF4FF] text-[#1D3A8A]">
                        ✓ Verified company
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {m.city}
                      </span>
                      {isSelected && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#C2410C]" />
                          <span>Selected Mover</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#475467] font-medium">{m.trucks}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {m.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F2F4F7] text-[#344054]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-[13px] text-[#101828]">
                      <strong className="text-[#C2410C]">{m.base}</strong> base ·{' '}
                      <strong>{m.km}</strong> · <strong>{m.helper}</strong>
                    </p>
                    {m.contacted && (
                      <span className="self-start px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#1D3A8A] text-xs font-bold">
                        {m.contacted}
                      </span>
                    )}
                  </div>

                  {/* Standardized Action Buttons: Fully legible, no truncation, with View Details */}
                  <div
                    className="flex flex-col gap-2 sm:w-64 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Top Row: Click-to-Reveal Phone & WhatsApp */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleCall(m)}
                        className="h-9 px-2.5 rounded-xl border border-orange-200 bg-orange-50/80 hover:bg-orange-100 text-[#9A3412] text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
                        title={revealedPhones[m.id] ? `Call ${m.name} (${m.phone})` : 'Click to show phone number'}
                      >
                        <Phone className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                        <span className="font-mono text-xs font-bold whitespace-nowrap">
                          {revealedPhones[m.id] ? m.phone : 'Call'}
                        </span>
                      </button>

                      <button
                        type="button"
                        aria-label={`WhatsApp ${m.name}`}
                        onClick={() => handleWhatsApp(m)}
                        className="h-9 px-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 text-xs font-bold whitespace-nowrap"
                        title={`Chat with ${m.name} on WhatsApp`}
                      >
                        <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                        <span className="text-xs font-bold text-emerald-800">WhatsApp</span>
                      </button>
                    </div>

                    {/* Bottom Row: View Details & Send Move Request */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/movers/${m.id}`}
                        className="h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer hover:border-slate-300 active:scale-95 whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Details</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleSendMove(m)}
                        className="h-9 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                      >
                        <span>Send Move</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[13px] text-[#667085]">
            SafarPK connects you directly with independent transport & moving carriers across Pakistan. Final quotes, packing details, and floor delivery surcharges are confirmed directly with your chosen carrier.
          </p>
        </div>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}
