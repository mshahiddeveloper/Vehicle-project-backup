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
import { getWhatsAppTargetUrl, startOrOpenConversation } from '@/data/chatEngine';
import { getActiveUser, isListingPaused } from '@/data/userAuth';
import {
  saveWishlistItem,
  removeWishlistItem,
  getSavedWishlistItems,
  setPendingWishlist,
  WishlistItem,
} from '@/data/wishlist';
import { useCountry } from '@/app/context/CountryContext';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
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
  ChevronLeft,
  Heart,
  Calendar,
} from 'lucide-react';

export default function MoverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';
  const { formatPrice } = useCountry();

  const [dbMover, setDbMover] = useState<MoverItem | undefined>(undefined);
  const mover: MoverItem | undefined = useMemo(() => {
    return (
      MOVERS_DATA.find((m) => m.id === id) ||
      MOVERS_DATA.find((m) => m.id.toLowerCase() === id.toLowerCase()) ||
      dbMover
    );
  }, [id, dbMover]);

  useEffect(() => {
    if (MOVERS_DATA.some((m) => m.id.toLowerCase() === id.toLowerCase())) return;
    fetch('/api/movers', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.movers)) {
          const found = data.movers.find((m: any) => m.id === id);
          if (found) {
            const base = Number(found.base_rate_pkr || 4500);
            const km = Number(found.per_km_rate_pkr || 120);
            const helper = Number(found.per_helper_rate_pkr || 1000);
            setDbMover({
              id: found.id,
              name: found.company_name,
              category: found.category || 'Home Shifting',
              city: found.city || 'Karachi',
              trucks: found.trucks || found.truck_type || 'Hyundai Shehzore',
              base: `Rs. ${base.toLocaleString()}`,
              baseNum: base,
              km: `Rs. ${km}/km`,
              helper: `Rs. ${helper.toLocaleString()}/helper`,
              tags: Array.isArray(found.features) ? found.features : ['Trained loaders'],
              phone: found.phone || found.owner_phone || '+92 300 4412987',
              whatsapp: (found.phone || found.owner_phone || '923004412987').replace(/\D/g, ''),
              rating: Number(found.rating || 4.8),
              tint: '#F3E6D3',
            });
          }
        }
      })
      .catch(() => {});
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
    const checkSaved = () => {
      const items = getSavedWishlistItems();
      setIsSaved(items.some((it) => it.id === mover.id));
    };
    checkSaved();
    window.addEventListener('safarpk_saved_updated', checkSaved);
    window.addEventListener('safarpk_favorites_updated', checkSaved);
    window.addEventListener('safarpk_auth_state_changed', checkSaved);
    return () => {
      window.removeEventListener('safarpk_saved_updated', checkSaved);
      window.removeEventListener('safarpk_favorites_updated', checkSaved);
      window.removeEventListener('safarpk_auth_state_changed', checkSaved);
    };
  }, [mover]);

  // safarpk_saved_items synchronization via central wishlist manager
  const handleToggleSaveMover = () => {
    if (!mover) return;
    const activeUser = getActiveUser();
    const moverItem: WishlistItem = {
      id: mover.id,
      category: 'mover',
      name: mover.name,
      title: `${mover.name} (${mover.category})`,
      sub: `${mover.trucks} · ${mover.city}`,
      specs: `${mover.base} base · ${mover.km} · ${mover.helper}`,
      city: mover.city,
      rate: `${mover.base} base`,
      price: `${mover.base} base`,
      href: `/movers/${mover.id}`,
    };

    if (!activeUser) {
      setPendingWishlist(moverItem, `/movers/${mover.id}`);
      router.push(`/login?pending_wishlist=1&redirect=${encodeURIComponent(`/movers/${mover.id}`)}`);
      return;
    }

    if (isSaved) {
      removeWishlistItem(mover.id);
      setIsSaved(false);
    } else {
      saveWishlistItem(moverItem);
      setIsSaved(true);
    }
  };

  const scrollToBooking = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('mover-booking-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Calculate dynamic moving quote
  const kmRateNum = mover ? parseInt(mover.km.replace(/\D/g, ''), 10) || 100 : 100;
  const helperRateNum = mover ? parseInt(mover.helper.replace(/\D/g, ''), 10) || 1000 : 1000;
  const estimatedCost = mover ? mover.baseNum + estimatedKm * kmRateNum + helpersCount * helperRateNum : 0;

  const handleCall = () => {
    if (!mover) return;
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
    if (!mover) return;
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

  const handleDirectChat = () => {
    if (!mover) return;
    const user = getActiveUser();
    if (!user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/movers/${mover.id}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (user.role === 'LISTER' || user.role === 'DRIVER' || user.role === 'PROVIDER') {
      router.push('/inbox');
      return;
    }

    recordClickEvent({
      clickType: 'CHAT_CLICK',
      targetId: mover.id,
      targetTitle: mover.name,
      targetCategory: 'HOME_SHIFTING',
      targetOwnerName: mover.name,
      city: mover.city,
    });

    const convId = startOrOpenConversation({
      currentUser: user,
      partnerId: mover.id,
      partnerName: mover.name,
      partnerRole: 'LISTER',
      partnerPhone: mover.whatsapp || mover.phone || '+92 300 1234567',
      about: `Home Shifting & Cargo: ${mover.name} (${mover.city})`,
      bookingMetadata: {
        category: 'mover',
        customerName: user.name,
        customerPhone: user.phone,
        customerCity: user.city || mover.city,
        providerName: mover.name,
        providerPhone: mover.whatsapp || mover.phone || '+92 300 1234567',
        itemName: `${mover.name} (${mover.trucks})`,
        totalEstimate: formatPrice(estimatedCost),
        serviceMode: 'Home Shifting & Cargo',
        bookingRef: `MOV-${Math.floor(10000 + Math.random() * 90000)}`,
      },
      initialGreeting: `Assalam-o-Alaikum ${mover.name}! I am looking for shifting services in ${mover.city} for ${houseSize}. Estimated distance: ${estimatedKm} km. Are you available?`,
    });

    router.push(`/inbox?conv=${convId}`);
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
    if (!mover) return;
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

  if (!mover) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between font-sans">
        <AppHeader />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-200 text-slate-700 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
            <Truck className="w-8 h-8 text-slate-600" />
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Moving Service Not Found
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The home shifting or cargo mover listing you requested is not available or may have been updated.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/movers"
              className="px-6 py-3 bg-[#0B6B4F] hover:bg-[#08513C] text-white rounded-2xl font-heading font-extrabold text-sm transition shadow-md"
            >
              Browse All Moving Services
            </Link>
          </div>
        </main>
        <AppFooter />
        <MobileNavBar />
      </div>
    );
  }

  const isPaused = isListingPaused(mover.id, mover.name);
  const storeSlug = getStoreSlugForOwner(mover.name);

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col justify-between">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-6 md:py-10 flex flex-col gap-4 sm:gap-6 pb-24 lg:pb-16">
        {/* Paused Service Notice */}
        {isPaused && (
          <div className="p-5 sm:p-6 bg-amber-50 border-2 border-amber-400 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-200 text-amber-900 uppercase tracking-wider">
                  ⚠️ Service Offline · Renewal Due
                </span>
                <span className="text-xs text-amber-800 font-bold">Mover Subscription Inactive</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                <strong>For Customers:</strong> This shifting and cargo service is temporarily offline due to provider subscription renewal. Please browse other active movers.
              </p>
              <p className="text-xs text-amber-800">
                <strong>For Mover Fleet Partner:</strong> Sign in to your dashboard to renew your subscription and reactivate your live listings.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Link
                href="/login?returnUrl=/subscription"
                className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                Mover Sign In to Renew
              </Link>
              <a
                href={`https://wa.me/923001234567?text=${encodeURIComponent(`Assalam-o-Alaikum Admin, I am owner of moving fleet ${mover.name} (${mover.id}) and need help with subscription renewal.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3.5 rounded-xl border border-amber-400 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Admin Support</span>
              </a>
              <Link
                href="/movers"
                className="h-10 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                Browse All Movers
              </Link>
            </div>
          </div>
        )}
        {/* Mobile App Navigation Bar (Native App Look) */}
        <div className="md:hidden flex items-center justify-between gap-2 pb-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 transition cursor-pointer shrink-0 shadow-2xs border border-slate-200/80"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-800 stroke-[2.5]" />
          </button>

          <div className="flex-1 min-w-0 text-center px-1">
            <span className="font-heading font-black text-sm text-[#101828] truncate block">
              {mover.name}
            </span>
            <span className="text-[10px] text-orange-700 font-bold block truncate">
              {mover.city} · Moving & Cargo Fleet
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyShare}
              className="w-10 h-10 rounded-2xl border border-slate-200/80 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition active:scale-95 shadow-2xs"
              aria-label="Share service"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> : <Share2 className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              type="button"
              onClick={handleToggleSaveMover}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition active:scale-95 shadow-2xs ${
                isSaved
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'text-rose-600 fill-rose-600' : 'text-slate-700'}`} />
            </button>
          </div>
        </div>

        {/* Desktop Navigation Breadcrumb */}
        <div className="hidden md:flex items-center justify-between flex-wrap gap-2 text-sm text-[#667085]">
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

        {/* Quick Mobile Action Bar: Calculate Quote & In-App Chat */}
        <div className="lg:hidden flex items-center gap-2 p-3 rounded-2xl bg-orange-50/80 border border-orange-200 shadow-2xs">
          <button
            type="button"
            onClick={scrollToBooking}
            className="flex-1 h-11 px-4 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-orange-200 shrink-0" />
            <span>Book Mover</span>
          </button>
          <button
            type="button"
            onClick={handleDirectChat}
            className="h-11 px-4 bg-white hover:bg-slate-50 text-orange-900 border border-orange-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer shrink-0"
            title="Chat directly on SafarPK"
          >
            <MessageSquare className="w-4 h-4 text-[#C2410C] fill-orange-100 shrink-0" />
            <span>Chat</span>
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
          <aside id="mover-booking-section" className="relative lg:sticky lg:top-24 border border-orange-200/90 rounded-3xl p-5 sm:p-6 bg-white shadow-lg space-y-4 scroll-mt-24 mb-4">
            {isPaused ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="text-xs space-y-1">
                    <strong className="block font-heading font-extrabold text-sm text-amber-900">
                      Moving Service Temporarily Offline
                    </strong>
                    <p className="text-amber-800 leading-relaxed">
                      Instant shifting calculations and booking requests are temporarily paused for this provider due to scheduled subscription renewal.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Link
                    href="/movers"
                    className="w-full h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-extrabold text-xs flex items-center justify-center gap-2 transition shadow cursor-pointer"
                  >
                    Browse Other Verified Movers
                  </Link>
                  <Link
                    href="/login?returnUrl=/subscription"
                    className="w-full h-10 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    Mover Sign In to Renew
                  </Link>
                </div>
              </div>
            ) : (
              <>
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

            {/* Step-wise Priority Booking & Contact Buttons:
                1) Primary: Book & Chat with Mover
                2) Secondary: WhatsApp & Call */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDirectChat}
                className="w-full h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>Book &amp; Chat with Mover</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="h-10 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#075E54] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.99]"
                >
                  <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCall}
                  className="h-10 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100 text-[#9A3412] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.99]"
                  title={phoneRevealed ? `Call host directly: ${mover.phone}` : 'Click to show phone number'}
                >
                  <Phone className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                  <span className="truncate">{phoneRevealed ? mover.phone : 'Call Mover'}</span>
                </button>
              </div>
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
                  className="w-full h-11 rounded-2xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4 text-orange-200" />
                  <span>Send Shifting Details & Get Quote</span>
                </button>
                <p className="text-[11px] text-slate-500 text-center font-medium pt-1">
                  Free shifting inspection & written quotation · Pay on shifting day
                </p>
              </form>
            )}
            </>
            )}
          </aside>
        </div>
      </main>

      {/* Mobile App Sticky Action Bar (Direct, Elevated, Never Hidden Behind Menu) */}
      {isPaused ? (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-amber-50/95 backdrop-blur-md border-t-2 border-amber-300 shadow-2xl flex items-center justify-between z-50">
          <div className="min-w-0 pr-2">
            <span className="text-xs font-black text-amber-900 block truncate">Service Offline</span>
            <span className="text-[10px] text-amber-700 block truncate">Mover renewal due</span>
          </div>
          <Link
            href="/movers"
            className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-md"
          >
            Browse Movers
          </Link>
        </div>
      ) : (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl flex items-center gap-2 z-50">
          <button
            type="button"
            onClick={handleCall}
            className="flex-1 h-12 rounded-2xl border border-orange-200 bg-orange-50 text-[#9A3412] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition shadow-2xs"
            title={phoneRevealed ? mover.phone : 'Click to show phone number'}
          >
            <Phone className="w-4 h-4 text-[#C2410C] shrink-0" />
            <span className="truncate">{phoneRevealed ? mover.phone : 'Show Number'}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
          >
            <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={scrollToBooking}
            className="flex-1 h-12 rounded-2xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
          >
            <Calculator className="w-4 h-4 text-orange-200 shrink-0" />
            <span>Get Quote</span>
          </button>
        </div>
      )}

      <div className="hidden md:block">
        <AppFooter />
      </div>
    </div>
  );
}

