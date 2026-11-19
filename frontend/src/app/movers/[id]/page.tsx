'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { MOVERS_DATA, MoverItem } from '@/data/marketplaceData';
import { getStoreSlugForOwner } from '@/data/storefrontEngine';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import { useCountry } from '@/app/context/CountryContext';
import {
  MapPin,
  Truck,
  Users,
  ShieldCheck,
  Phone,
  MessageSquare,
  Share2,
  Check,
  CheckCircle2,
  Calculator,
  Box,
  ChevronDown,
  Heart,
} from 'lucide-react';

export default function MoverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';
  const { formatPrice } = useCountry();

  const mover: MoverItem | undefined = useMemo(() => {
    return (
      MOVERS_DATA.find((m) => m.id === id) ||
      MOVERS_DATA.find((m) => m.id.toLowerCase() === id.toLowerCase()) ||
      MOVERS_DATA[0]
    );
  }, [id]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [helpersCount, setHelpersCount] = useState(2);
  const [estimatedKm, setEstimatedKm] = useState(15);
  const [houseSize, setHouseSize] = useState('2-3 Bedroom Apartment / Portion');
  const [fromArea, setFromArea] = useState('');
  const [toArea, setToArea] = useState('');
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [standardsOpen, setStandardsOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!mover) return;
    try {
      const raw = localStorage.getItem('safarpk_saved_items');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.some((it: any) => it.id === mover.id || it.name === mover.name)) {
          setIsSaved(true);
        }
      }
    } catch {}
  }, [mover]);

  const handleToggleSaveMover = () => {
    if (!mover) return;
    try {
      const raw = localStorage.getItem('safarpk_saved_items');
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      const already = list.some((it: any) => it.id === mover.id || it.name === mover.name);
      if (already) {
        list = list.filter((it: any) => it.id !== mover.id && it.name !== mover.name);
        setIsSaved(false);
      } else {
        list.unshift({
          id: mover.id,
          category: 'mover',
          name: mover.name,
          sub: `${mover.trucks} · ${mover.city}`,
          price: `${mover.baseFare} base fare`,
          href: `/movers/${mover.id}`,
          savedAt: new Date().toISOString(),
        });
        setIsSaved(true);
      }
      localStorage.setItem('safarpk_saved_items', JSON.stringify(list));
      window.dispatchEvent(new Event('safarpk_saved_updated'));
      window.dispatchEvent(new Event('safarpk_favorites_updated'));
    } catch {}
  };

  const scrollToBooking = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('mover-booking-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Calculate dynamic moving quote
  const kmRateNum = parseInt(mover.km.replace(/\D/g, ''), 10) || 100;
  const helperRateNum = parseInt(mover.helper.replace(/\D/g, ''), 10) || 1000;
  const estimatedCost = mover.baseNum + estimatedKm * kmRateNum + helpersCount * helperRateNum;

  const handleCall = () => {
    setPhoneRevealed(true);
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: mover.id,
      targetTitle: mover.name,
      targetCategory: 'HOME_SHIFTING',
      targetOwnerName: mover.name,
      city: mover.city,
    });
    recordLead({
      userId: mover.id,
      customerName: 'Direct Moving Caller',
      customerPhone: 'Phone Dial',
      customerCity: mover.city,
      serviceType: 'Home Shifting',
      notes: `Direct call to mover ${mover.name} for shifting quote`,
    });
    if (phoneRevealed) {
      window.location.href = `tel:${mover.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleWhatsApp = () => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: mover.id,
      targetTitle: mover.name,
      targetCategory: 'HOME_SHIFTING',
      targetOwnerName: mover.name,
      city: mover.city,
    });
    recordLead({
      userId: mover.id,
      customerName: 'Moving WhatsApp Inquirer',
      customerPhone: 'WhatsApp Chat',
      customerCity: mover.city,
      serviceType: 'Home Shifting',
      notes: `WhatsApp inquiry for moving with ${mover.name} (Estimated: ${formatPrice(estimatedCost)})`,
    });

    const text = `Assalam-o-Alaikum ${mover.name},\n\nI am contacting you from SafarPK regarding Home Shifting & Cargo:\n• Scope: ${houseSize}\n• Approximate Distance: ${estimatedKm} km\n• Helpers Required: ${helpersCount}\n• Estimated Total: ${formatPrice(estimatedCost)}\n\nPlease provide your final quotation and schedule availability.`;
    const waUrl = getWhatsAppTargetUrl(mover.whatsapp || mover.phone, text);
    window.open(waUrl, '_blank');
  };

  const handleCopyShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordLead({
      userId: mover.id,
      customerName: 'Formal Moving Quotation Lead',
      customerPhone: 'Quotation Request',
      customerCity: mover.city,
      serviceType: 'Home Shifting',
      notes: `From ${fromArea} to ${toArea} · Scope: ${houseSize} · Est: ${formatPrice(estimatedCost)}`,
    });
    setQuoteSuccess(true);
  };

  const storeSlug = getStoreSlugForOwner(mover.name);

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col justify-between">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-6 md:py-10 flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-[#667085]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#101828]">
              Home
            </Link>
            <span>/</span>
            <Link href="/movers" className="hover:text-[#101828]">
              Home Shifting
            </Link>
            <span>/</span>
            <span className="text-[#101828] font-semibold truncate max-w-[200px] sm:max-w-md">
              {mover.name}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share Service</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleSaveMover}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs ${
                isSaved
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'text-rose-600 fill-rose-600' : 'text-slate-500'}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="rounded-3xl bg-gradient-to-r from-[#7C2D12] via-slate-900 to-[#9A3412] text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-orange-200 border border-white/20">
                <Truck className="w-3.5 h-3.5" />
                <span>Professional House Shifting & Cargo Fleet</span>
              </div>
              <h1 className="font-heading font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-tight">
                {mover.name}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl">
                {mover.trucks} · Base rate from {mover.base} · {mover.city}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15">
              <span className="text-xs text-orange-200 font-bold uppercase tracking-wider">
                Base Fare Starts At
              </span>
              <div className="font-heading font-black text-2xl sm:text-3xl text-white">
                {formatPrice(mover.baseNum)}
              </div>
              <span className="text-xs text-slate-300">Excluding distance & helper fee</span>
            </div>
          </div>
        </div>

        {/* Quick Mobile Action Bar: Calculate Quote & Book */}
        <div className="lg:hidden flex items-center gap-2 p-3 rounded-2xl bg-orange-50/80 border border-orange-200 shadow-2xs">
          <button
            type="button"
            onClick={scrollToBooking}
            className="flex-1 h-11 px-4 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-orange-200 shrink-0" />
            <span>Calculate Shifting Cost & Book</span>
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="h-11 px-3.5 bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer shrink-0"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start pt-2">
          {/* Left Column: Details & Operator Identity */}
          <div className="flex flex-col gap-5">
            {/* Clickable Host / Operator Identity Section */}
            <Link
              href={`/store/${storeSlug}`}
              className="p-4 sm:p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 flex items-center gap-4 border border-slate-200/80 hover:border-slate-300 transition group cursor-pointer"
              title={`View ${mover.name}'s Public Storefront`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#C2410C] text-white flex items-center justify-center font-heading font-extrabold text-lg sm:text-xl shrink-0 group-hover:scale-105 transition shadow-sm">
                {mover.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#C2410C] transition truncate">
                    Operated by {mover.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 text-[#9A3412] text-[10px] font-bold">
                    Fleet Store ➔
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Direct Moving & Freight Fleet · Serving {mover.city} & Outstation
                </p>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs">
                Direct Provider
              </span>
            </Link>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Truck className="w-4 h-4 text-[#C2410C]" />
                <span className="text-[11px] text-slate-500">Truck Fleet</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {mover.category}
                </span>
              </div>
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Calculator className="w-4 h-4 text-[#C2410C]" />
                <span className="text-[11px] text-slate-500">Base Tariff</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {mover.base}
                </span>
              </div>
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <MapPin className="w-4 h-4 text-[#C2410C]" />
                <span className="text-[11px] text-slate-500">Distance Tariff</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {mover.km}
                </span>
              </div>
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Users className="w-4 h-4 text-[#C2410C]" />
                <span className="text-[11px] text-slate-500">Helper Tariff</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {mover.helper}
                </span>
              </div>
            </div>

            {/* Service Inclusions (Mobile Accordion) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
              <button
                type="button"
                onClick={() => setStandardsOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
                      <span>Service Standards & Capabilities</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-[#9A3412] border border-orange-200">
                      Standard Inclusions
                    </span>
                  </div>
                  {/* Summary preview */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Furniture Packing
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Covered Trucks
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Trained Loaders
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                    {standardsOpen ? 'Collapse' : 'View all'}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${standardsOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {standardsOpen && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 space-y-3.5 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#C2410C] shrink-0" />
                      <span>Heavy furniture packing with protective blankets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#C2410C] shrink-0" />
                      <span>Bed and wardrobe disassembly & reassembly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#C2410C] shrink-0" />
                      <span>Weather-proof covered container trucks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#C2410C] shrink-0" />
                      <span>Trained physical loaders for careful stair handling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#C2410C] shrink-0" />
                      <span>Local city moves as well as intercity relocation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#C2410C] shrink-0" />
                      <span>Transparent direct billing upon job completion</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
                    {mover.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-[#9A3412] border border-orange-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Safety Notice (Mobile Accordion) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
              <button
                type="button"
                onClick={() => setPoliciesOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#C2410C]" />
                    <span>Moving Guidelines & Floor Terms</span>
                  </h2>
                  {!policiesOpen && (
                    <p className="text-xs text-slate-500 line-clamp-1 pt-1">
                      Direct provider billing, fragile item packing & building floor elevation guidelines.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                    {policiesOpen ? 'Collapse' : 'Read'}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${policiesOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>
              {policiesOpen && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 text-xs text-slate-600 leading-relaxed space-y-2 animate-in fade-in">
                  <p>
                    <strong>Notice:</strong> SafarPK provides a direct communication bridge between homeowners and independent moving fleets.
                  </p>
                  <p>
                    Confirm fragile item packing, packing boxes, and building floor elevation surcharges directly with the mover prior to loading. Direct settlement upon job completion.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Quote Calculator & Contact Card */}
          <aside id="mover-booking-section" className="sticky top-24 border border-orange-200/90 rounded-3xl p-6 bg-white shadow-lg space-y-4 scroll-mt-24">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Instant Shifting Calculator
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[10px] font-bold">
                {mover.category}
              </span>
            </div>

            {/* Calculator Controls */}
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Trip Distance: <span className="font-extrabold text-[#C2410C]">{estimatedKm} km</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={estimatedKm}
                  onChange={(e) => setEstimatedKm(parseInt(e.target.value, 10))}
                  className="w-full accent-[#C2410C] cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>5 km (Local)</span>
                  <span>50 km</span>
                  <span>100 km (Intercity)</span>
                </div>
              </div>

              {/* Helpers Stepper with Unlimited + / - */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Loaders / Helpers</span>
                  <span className="font-extrabold text-xs text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                    {helpersCount === 0 ? 'No helpers (Truck only)' : `${helpersCount} ${helpersCount === 1 ? 'helper' : 'helpers'}`}
                  </span>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
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
            </div>

            {/* Estimated Total Display */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-orange-50/80 to-amber-50/40 border border-orange-200 text-center space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold tracking-wider text-orange-900 uppercase">
                Estimated Shifting Total
              </span>
              <div className="font-heading font-black text-3xl text-[#9A3412]">
                {formatPrice(estimatedCost)}
              </div>
              <p className="text-[11px] text-[#C2410C]">
                Base {mover.base} + {estimatedKm}km ({mover.km}) + {helpersCount} helpers
              </p>
            </div>

            {/* Direct Contact Buttons (Publicly accessible without login) */}
            <div className="space-y-2 pt-1">
              {/* Instant WhatsApp Button */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 fill-white/20" />
                <span>Chat on WhatsApp</span>
              </button>

              {/* Direct Call Button (Click-to-Reveal Pattern) */}
              <button
                type="button"
                onClick={handleCall}
                className="w-full h-10 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100 text-[#9A3412] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-[0.99]"
                title={phoneRevealed ? `Call host directly: ${mover.phone}` : 'Click to show phone number'}
              >
                <Phone className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>
                  {phoneRevealed ? (
                    <>Call Host: <span className="font-mono font-bold">{mover.phone}</span></>
                  ) : (
                    'Show Phone Number'
                  )}
                </span>
              </button>
            </div>

            {/* Quote Inquiry Form */}
            {quoteSuccess ? (
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#C2410C] mx-auto" />
                <h4 className="font-heading font-bold text-sm text-[#9A3412]">
                  Quote Request Dispatched!
                </h4>
                <p className="text-xs text-[#C2410C]">
                  {mover.name} will review your route and contact you directly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">
                  Request Official Inspection / Quote
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Pickup Area"
                    value={fromArea}
                    onChange={(e) => setFromArea(e.target.value)}
                    className="h-9 px-2 rounded-lg border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#C2410C]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Dropoff Area"
                    value={toArea}
                    onChange={(e) => setToArea(e.target.value)}
                    className="h-9 px-2 rounded-lg border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#C2410C]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-9 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs transition cursor-pointer shadow-2xs active:scale-[0.99]"
                >
                  Send Shifting Details
                </button>
              </form>
            )}
          </aside>
        </div>
      </main>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200 shadow-xl flex items-center gap-2 z-40">
        <button
          type="button"
          onClick={handleCall}
          className="flex-1 h-11 rounded-xl border border-orange-200 bg-orange-50 text-[#9A3412] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <Phone className="w-3.5 h-3.5 text-[#C2410C]" />
          <span>{phoneRevealed ? mover.phone : 'Show Number'}</span>
        </button>
        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
          <span>WhatsApp</span>
        </button>
      </div>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

