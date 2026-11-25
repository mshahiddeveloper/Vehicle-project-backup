'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { SHUTTLES_DATA, ShuttleItem } from '@/data/marketplaceData';
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
import { UnifiedMobileStickyBar } from '@/components/UnifiedDetailKit';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Bus,
  Phone,
  MessageSquare,
  Share2,
  Check,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  Heart,
} from 'lucide-react';

export default function ShuttleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';
  const { country, formatPrice } = useCountry();
  const isPakistan = !country || country.code === 'PK';

  const [dbShuttle, setDbShuttle] = useState<ShuttleItem | undefined>(undefined);
  const shuttle: ShuttleItem | undefined = useMemo(() => {
    return (
      SHUTTLES_DATA.find((s) => s.id === id) ||
      SHUTTLES_DATA.find((s) => s.id.toLowerCase() === id.toLowerCase()) ||
      dbShuttle
    );
  }, [id, dbShuttle]);

  useEffect(() => {
    if (SHUTTLES_DATA.some((s) => s.id.toLowerCase() === id.toLowerCase())) return;
    fetch('/api/shuttles', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.shuttles)) {
          const s = data.shuttles.find((x: any) => x.id === id);
          if (s) {
            const fare = Number(s.monthly_fare_pkr || 14000);
            const parts = String(s.route_name || '').split(/➔|->|to/i).map((p: string) => p.trim());
            const pickups = Array.isArray(s.pickup_stops) ? s.pickup_stops : [];
            const drops = Array.isArray(s.dropoff_stops) ? s.dropoff_stops : [];
            setDbShuttle({
              id: s.id,
              op: s.operator || s.operator_name || 'SafarPK Shuttle',
              city: s.city || 'Karachi',
              from: parts[0] || pickups[0] || s.city || 'Main Hub',
              to: parts[1] || drops[0] || 'City Center',
              stops: [...pickups, ...drops],
              van: s.vehicle_model || 'Toyota Hiace AC',
              fare: `Rs. ${fare.toLocaleString()}`,
              fareNum: fare,
              seats: Number(s.available_seats || 6),
              timing: `${s.morning_departure_time || '07:45'} - ${s.evening_return_time || '17:30'}`,
              tags: [s.category || 'Office & Corporate', 'AC Van'],
              phone: s.operator_phone || s.phone || '+92 300 1234567',
              whatsapp: (s.operator_phone || s.phone || '923001234567').replace(/\D/g, ''),
              category: s.category || 'Office & Corporate',
              tint: '#DCEBE3',
            });
          }
        }
      })
      .catch(() => {});
  }, [id]);

  const isGirlsOnly = useMemo(() => {
    return (
      shuttle?.category?.toLowerCase().includes('girls') ||
      shuttle?.tags?.some((t) => t.toLowerCase().includes('girls'))
    );
  }, [shuttle]);

  const isBoysOnly = useMemo(() => {
    return (
      shuttle?.category?.toLowerCase().includes('boys') ||
      shuttle?.tags?.some((t) => t.toLowerCase().includes('boys'))
    );
  }, [shuttle]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [passengerCategory, setPassengerCategory] = useState('Office / Corporate Commuter');
  const [passengerGender, setPassengerGender] = useState<'Male' | 'Female'>(
    isGirlsOnly ? 'Female' : 'Male'
  );
  const [pickupStop, setPickupStop] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [stopsOpen, setStopsOpen] = useState(true);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!shuttle) return;
    const checkSaved = () => {
      const items = getSavedWishlistItems();
      setIsSaved(items.some((it) => it.id === shuttle.id));
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
  }, [shuttle]);

  // safarpk_saved_items synchronization via central wishlist manager
  const handleToggleSaveShuttle = () => {
    if (!shuttle) return;
    const activeUser = getActiveUser();
    const fareFormatted = `Rs. ${(shuttle.fareNum || shuttle.fare).toLocaleString()} / month`;
    const shuttleItem: WishlistItem = {
      id: shuttle.id,
      category: 'shuttle',
      name: `${shuttle.op} (${shuttle.from} ➔ ${shuttle.to})`,
      title: `${shuttle.op} · ${shuttle.from} to ${shuttle.to}`,
      sub: `${shuttle.van} · ${shuttle.city}`,
      specs: `${shuttle.van} · ${shuttle.seats} seats vacant`,
      city: shuttle.city,
      rate: fareFormatted,
      price: fareFormatted,
      href: `/shuttles/${shuttle.id}`,
    };

    if (!activeUser) {
      setPendingWishlist(shuttleItem, `/shuttles/${shuttle.id}`);
      router.push(`/login?pending_wishlist=1&redirect=${encodeURIComponent(`/shuttles/${shuttle.id}`)}`);
      return;
    }

    if (isSaved) {
      removeWishlistItem(shuttle.id);
      setIsSaved(false);
    } else {
      saveWishlistItem(shuttleItem);
      setIsSaved(true);
    }
  };

  const scrollToBooking = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('shuttle-booking-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleCall = () => {
    if (!shuttle) return;
    setPhoneRevealed(true);
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: shuttle.id,
      targetTitle: `${shuttle.from} to ${shuttle.to} (${shuttle.op})`,
      targetCategory: 'PICK_AND_DROP',
      targetOwnerName: shuttle.op,
      city: shuttle.city,
    });
    recordLead({
      userId: shuttle.id,
      customerName: 'Direct Shuttle Caller',
      customerPhone: 'Phone Dial',
      customerCity: shuttle.city,
      serviceType: 'Pick & Drop',
      notes: `Direct call for commuter route ${shuttle.from} ➔ ${shuttle.to} with ${shuttle.op}`,
    });
    if (phoneRevealed) {
      window.location.href = `tel:${shuttle.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleWhatsApp = () => {
    if (!shuttle) return;
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: shuttle.id,
      targetTitle: `${shuttle.from} to ${shuttle.to} (${shuttle.op})`,
      targetCategory: 'PICK_AND_DROP',
      targetOwnerName: shuttle.op,
      city: shuttle.city,
    });
    recordLead({
      userId: shuttle.id,
      customerName: 'Shuttle WhatsApp Inquirer',
      customerPhone: 'WhatsApp Chat',
      customerCity: shuttle.city,
      serviceType: 'Pick & Drop',
      notes: `Direct WhatsApp inquiry for shuttle ${shuttle.from} ➔ ${shuttle.to}`,
    });

    const text = `Assalam-o-Alaikum ${shuttle.op},\n\nI am contacting you from SafarPK regarding your Pick & Drop commuter shuttle:\n• Route: ${shuttle.from} ➔ ${shuttle.to}\n• Passenger: ${passengerCategory} (${passengerGender})\n• Desired Stop: ${pickupStop || 'Along route'}\n• Timings: Morning ${shuttle.pick} | Return ${shuttle.back}\n• Vehicle: ${shuttle.van}\n• Monthly Seat Fare: ${shuttle.fare}\n\nAre seats still vacant for this month? Please share stop details.`;
    const waUrl = getWhatsAppTargetUrl(shuttle.whatsapp || shuttle.phone, text);
    window.open(waUrl, '_blank');
  };

  const handleDirectChat = () => {
    if (!shuttle) return;
    const user = getActiveUser();
    if (!user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/shuttles/${shuttle.id}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (user.role === 'LISTER' || user.role === 'DRIVER' || user.role === 'PROVIDER') {
      router.push('/inbox');
      return;
    }

    recordClickEvent({
      clickType: 'CHAT_CLICK',
      targetId: shuttle.id,
      targetTitle: `${shuttle.from} to ${shuttle.to} (${shuttle.op})`,
      targetCategory: 'PICK_AND_DROP',
      targetOwnerName: shuttle.op,
      city: shuttle.city,
    });

    const convId = startOrOpenConversation({
      currentUser: user,
      partnerId: shuttle.id,
      partnerName: shuttle.op,
      partnerRole: 'LISTER',
      partnerPhone: shuttle.whatsapp || shuttle.phone || '+92 300 1234567',
      about: `Pick & Drop: ${shuttle.from} ➔ ${shuttle.to} (${shuttle.op})`,
      bookingMetadata: {
        category: 'shuttle',
        customerName: user.name,
        customerPhone: user.phone,
        customerCity: user.city || shuttle.city,
        providerName: shuttle.op,
        providerPhone: shuttle.whatsapp || shuttle.phone || '+92 300 1234567',
        itemName: `${shuttle.from} to ${shuttle.to} (${shuttle.van})`,
        totalEstimate: `${formatPrice(shuttle.fareNum)} /month`,
        serviceMode: 'Pick & Drop Shuttle',
        bookingRef: `SHT-${Math.floor(10000 + Math.random() * 90000)}`,
      },
      initialGreeting: `Assalam-o-Alaikum ${shuttle.op}! I am interested in reserving a monthly seat on your route ${shuttle.from} to ${shuttle.to}. Are seats available?`,
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

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shuttle) return;
    recordLead({
      userId: shuttle.id,
      customerName: `${passengerGender} Commuter (${passengerCategory})`,
      customerPhone: 'Seat Application',
      customerCity: shuttle.city,
      serviceType: 'Pick & Drop',
      notes: `Commuter seat application for ${shuttle.from} to ${shuttle.to} (${passengerCategory} · ${passengerGender} Commuter · Stop: ${pickupStop || 'Not specified'})`,
    });
    setInquirySuccess(true);
  };

  if (!shuttle) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between font-sans">
        <AppHeader />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-200 text-slate-700 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
            <Bus className="w-8 h-8 text-slate-600" />
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Pick & Drop Route Not Found
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The pick & drop shuttle route listing you requested is not available or may have been updated.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/pick-and-drop"
              className="px-6 py-3 bg-[#0B6B4F] hover:bg-[#08513C] text-white rounded-2xl font-heading font-extrabold text-sm transition shadow-md"
            >
              Browse All Pick & Drop Routes
            </Link>
          </div>
        </main>
        <AppFooter />
        <MobileNavBar />
      </div>
    );
  }

  const isPaused = isListingPaused(shuttle.id, shuttle.op);
  const storeSlug = getStoreSlugForOwner(shuttle.op);

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col justify-between">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-6 md:py-10 flex flex-col gap-4 sm:gap-6 pb-24 lg:pb-16">
        {/* Paused Route Notice */}
        {isPaused && (
          <div className="p-5 sm:p-6 bg-amber-50 border-2 border-amber-400 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-200 text-amber-900 uppercase tracking-wider">
                  ⚠️ Route Offline · Renewal Due
                </span>
                <span className="text-xs text-amber-800 font-bold">Operator Subscription Inactive</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                <strong>For Commuters:</strong> This shuttle route is temporarily offline due to operator subscription renewal. Please browse alternative active routes.
              </p>
              <p className="text-xs text-amber-800">
                <strong>For Route Operator:</strong> Sign in to your dashboard to renew your subscription and reactivate your live routes.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Link
                href="/login?returnUrl=/subscription"
                className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                Operator Sign In to Renew
              </Link>
              <a
                href={`https://wa.me/923001234567?text=${encodeURIComponent(`Assalam-o-Alaikum Admin, I am operator for shuttle route ${shuttle.from} to ${shuttle.to} (${shuttle.id}) and need help with subscription renewal.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3.5 rounded-xl border border-amber-400 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Admin Support</span>
              </a>
              <Link
                href="/pick-and-drop"
                className="h-10 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                Browse All Routes
              </Link>
            </div>
          </div>
        )}
        {/* Mobile App Navigation Bar (Native App Look & Feel) */}
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
              {shuttle.from} ➔ {shuttle.to}
            </span>
            <span className="text-[10px] text-[#0B6B4F] font-bold block truncate">
              {shuttle.city} · Pick & Drop Shuttle
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyShare}
              className="w-10 h-10 rounded-2xl border border-slate-200/80 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition active:scale-95 shadow-2xs"
              aria-label="Share route"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> : <Share2 className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              type="button"
              onClick={handleToggleSaveShuttle}
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
            <Link href="/shuttles" className="hover:text-[#101828]">
              Pick & Drop
            </Link>
            <span>/</span>
            <span className="text-[#101828] font-semibold truncate max-w-[200px] sm:max-w-md">
              {shuttle.from} to {shuttle.to}
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
                  <span>Share Route</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleSaveShuttle}
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

        {/* Route Hero Card */}
        <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-teal-200 border border-white/20">
                <Bus className="w-3.5 h-3.5" />
                <span>Daily Pick & Drop Commuter Shuttle · {shuttle.days}</span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-4xl tracking-tight">
                {shuttle.from} <span className="text-teal-400">➔</span> {shuttle.to}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl">
                {shuttle.van} · Morning: {shuttle.pick} · Evening Return: {shuttle.back}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15">
              <span className="text-xs text-teal-200 font-bold uppercase tracking-wider">
                Monthly Seat Subscription
              </span>
              <div className="font-heading font-black text-2xl sm:text-3xl text-white">
                {formatPrice(shuttle.fareNum)}
              </div>
              <span className="text-xs text-slate-300">Per seat / monthly inclusive</span>
            </div>
          </div>
        </div>

        {/* Quick Mobile Action Bar: Reserve Seat & In-App Chat */}
        <div className="lg:hidden flex items-center gap-2 p-3 rounded-2xl bg-teal-50/80 border border-teal-200 shadow-2xs">
          <button
            type="button"
            onClick={scrollToBooking}
            className="flex-1 h-11 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-teal-200 shrink-0" />
            <span>Reserve Seat</span>
          </button>
          <button
            type="button"
            onClick={handleDirectChat}
            className="h-11 px-4 bg-white hover:bg-slate-50 text-teal-900 border border-teal-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer shrink-0"
            title="Chat directly on SafarPK"
          >
            <MessageSquare className="w-4 h-4 text-teal-700 fill-teal-100 shrink-0" />
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
              title={`View ${shuttle.op}'s Public Storefront`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-teal-900 text-white flex items-center justify-center font-heading font-extrabold text-lg sm:text-xl shrink-0 group-hover:scale-105 transition">
                {shuttle.op.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-teal-700 transition truncate">
                    Operated by {shuttle.op}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">
                    Fleet Store ➔
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Registered Commuter Fleet Host · Operating across {shuttle.city}
                </p>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs">
                Active Route
              </span>
            </Link>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Clock className="w-4 h-4 text-teal-600" />
                <span className="text-[11px] text-slate-500">Morning Pickup</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {shuttle.pick}
                </span>
              </div>
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Clock className="w-4 h-4 text-teal-600" />
                <span className="text-[11px] text-slate-500">Return Departure</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {shuttle.back}
                </span>
              </div>
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Users className="w-4 h-4 text-teal-600" />
                <span className="text-[11px] text-slate-500">Vacant Seats</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-emerald-700 truncate">
                  {shuttle.seats > 0 ? `${shuttle.seats} Available` : 'Fully Booked'}
                </span>
              </div>
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span className="text-[11px] text-slate-500">Days</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {shuttle.days}
                </span>
              </div>
            </div>

            {/* Commuter Route Corridor & Intermediate Stops Timeline (Mobile Accordion) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
              <button
                type="button"
                onClick={() => setStopsOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-700" />
                      <span>Route Corridor & Intermediate Stops</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {shuttle.stops?.length || 0} Stops
                    </span>
                  </div>
                  {/* Summary preview */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">{shuttle.from}</span>
                    <span className="text-slate-400">➔</span>
                    <span className="font-semibold text-slate-800">{shuttle.to}</span>
                    <span className="text-slate-500 text-[10px]">
                      ({shuttle.stops?.length || 0} stops in between)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                    {stopsOpen ? 'Collapse' : 'View route'}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${stopsOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {stopsOpen && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 space-y-3.5 animate-in fade-in">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This commuter route operates on a fixed corridor through {shuttle.city}. You can reserve a seat from origin to destination, or for any in-between sub-route.
                  </p>

                  {/* Visual Vertical Timeline of Corridor */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3">
                    {/* 1. Origin Stop */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-xs shrink-0" />
                        <span className="w-0.5 h-6 bg-slate-300" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">
                          Start / First Pickup
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-900">{shuttle.from}</span>
                        <span className="text-xs text-slate-500 ml-2">({shuttle.pick})</span>
                      </div>
                    </div>

                    {/* 2. Intermediate Waypoints */}
                    {shuttle.stops && shuttle.stops.length > 0 && (
                      shuttle.stops.map((stop, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 border-2 border-white shadow-2xs shrink-0" />
                            <span className="w-0.5 h-6 bg-slate-300" />
                          </div>
                          <div className="flex items-center justify-between flex-1 flex-wrap gap-1">
                            <div>
                              <span className="text-[10px] font-bold text-purple-700 uppercase block">
                                Corridor Stop #{idx + 1}
                              </span>
                              <span className="font-semibold text-xs sm:text-sm text-slate-800">
                                {stop}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              Boarding / Drop-off
                            </span>
                          </div>
                        </div>
                      ))
                    )}

                    {/* 3. Destination Stop */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span className="w-3.5 h-3.5 rounded-full bg-purple-800 border-2 border-white shadow-xs shrink-0" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-purple-800 tracking-wider block">
                          Final Destination / Hub
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-900">{shuttle.to}</span>
                        <span className="text-xs text-slate-500 ml-2">(Return departure: {shuttle.back})</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Inclusions & Features (Mobile Accordion) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
              <button
                type="button"
                onClick={() => setFeaturesOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>Van Amenities & Commuter Features</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                      Standard Inclusions
                    </span>
                  </div>
                  {/* Summary preview */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Dual AC
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Punctual Schedule
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Fixed Monthly Fare
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                    {featuresOpen ? 'Collapse' : 'View all'}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {featuresOpen && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 space-y-3.5 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Dual air-conditioned comfortable seating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Fixed, punctual arrival and departure schedules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Safe doorstep or neighborhood designated pickup points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Monthly fixed fare with zero surge charges</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{isPakistan ? 'Experienced, verified commercial route driver' : 'Experienced, vetted commercial route driver'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Direct monthly payment to the operator</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
                    {shuttle.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700"
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
                    <AlertCircle className="w-4 h-4 text-teal-700" />
                    <span>Commuter Safety & Booking Guidelines</span>
                  </h2>
                  {!policiesOpen && (
                    <p className="text-xs text-slate-500 line-clamp-1 pt-1">
                      Direct monthly pass settlement, designated landmark stops & timing rules.
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
                    <strong>Notice:</strong> SafarPK connects passengers directly with local shuttle fleet operators.
                  </p>
                  <p>
                    Confirm pickup landmarks, attendant presence, and monthly payment terms directly with the operator before booking.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing & Contact Card */}
          <aside id="shuttle-booking-section" className="relative lg:sticky lg:top-24 border border-slate-200/90 rounded-3xl p-5 sm:p-6 bg-white shadow-lg space-y-5 scroll-mt-24 mb-4">
            {isPaused ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="text-xs space-y-1">
                    <strong className="block font-heading font-extrabold text-sm text-amber-900">
                      Route Temporarily Offline
                    </strong>
                    <p className="text-amber-800 leading-relaxed">
                      Online seat reservations are temporarily paused for this operator due to scheduled subscription renewal.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Link
                    href="/pick-and-drop"
                    className="w-full h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-extrabold text-xs flex items-center justify-center gap-2 transition shadow cursor-pointer"
                  >
                    Browse Other Pick & Drop Routes
                  </Link>
                  <Link
                    href="/login?returnUrl=/subscription"
                    className="w-full h-10 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    Operator Sign In to Renew
                  </Link>
                </div>
              </div>
            ) : (
              <>
            {/* Vacancy Status Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Monthly Pass
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  shuttle.seats > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {shuttle.seats > 0 ? `${shuttle.seats} Seats Left` : 'Waitlist Only'}
              </span>
            </div>

            {/* Pricing Display */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Per Seat Monthly Rate
              </span>
              <div className="font-heading font-black text-3xl text-slate-900">
                {formatPrice(shuttle.fareNum)}
              </div>
              <p className="text-xs text-slate-500">
                Covers morning pickup & afternoon return all month
              </p>
            </div>

            {/* Step-wise Priority Booking & Contact Buttons:
                1) Primary: Book & Chat with Operator
                2) Secondary: WhatsApp & Call */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDirectChat}
                className="w-full h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>Book &amp; Chat with Operator</span>
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
                  className="h-10 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-teal-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.99]"
                  title={phoneRevealed ? `Call host directly: ${shuttle.phone}` : 'Click to show phone number'}
                >
                  <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">{phoneRevealed ? shuttle.phone : 'Call Host'}</span>
                </button>
              </div>
            </div>

            {/* Seat Inquiry Form */}
            {inquirySuccess ? (
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
                <h4 className="font-heading font-bold text-sm text-teal-900">
                  Seat Application Sent!
                </h4>
                <p className="text-xs text-teal-700">
                  {shuttle.op} will contact you shortly to confirm your pickup stop.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">
                  Reserve Seat or Inquire
                </span>

                {/* 2-Column Responsive: Passenger Category (Left) and Gender (Right) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 block truncate">
                      Passenger Category
                    </label>
                    <select
                      value={passengerCategory}
                      onChange={(e) => setPassengerCategory(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-teal-500 bg-white cursor-pointer"
                    >
                      <option value="Office / Corporate Commuter">Office / Corporate</option>
                      <option value="School / College Student">School / College</option>
                      <option value="University Student">University</option>
                      <option value="Daily Commuter">Daily Commuter</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 block truncate">
                      Select Gender
                    </label>
                    <select
                      value={passengerGender}
                      onChange={(e) => setPassengerGender(e.target.value as 'Male' | 'Female')}
                      className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-teal-500 bg-white cursor-pointer"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                </div>

                {isGirlsOnly && passengerGender === 'Male' && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>Notice: This route is designated <strong>Girls / Ladies only</strong> by {shuttle.op}.</span>
                  </div>
                )}
                {isBoysOnly && passengerGender === 'Female' && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>Notice: This route is designated <strong>Boys only</strong> by {shuttle.op}.</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Desired Pickup Stop</label>
                  <input
                    type="text"
                    placeholder="e.g. Phase 5 Sector C Chowk"
                    value={pickupStop}
                    onChange={(e) => setPickupStop(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-2xl bg-[#101828] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Apply for Monthly Seat</span>
                </button>
                <p className="text-[11px] text-slate-500 text-center font-medium pt-1">
                  Direct host reservation · Pay monthly fee at ride start
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
            <span className="text-xs font-black text-amber-900 block truncate">Route Offline</span>
            <span className="text-[10px] text-amber-700 block truncate">Operator renewal due</span>
          </div>
          <Link
            href="/pick-and-drop"
            className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-md"
          >
            Browse Routes
          </Link>
        </div>
      ) : (
        <UnifiedMobileStickyBar
          priceText={formatPrice(shuttle.fareNum || shuttle.fare)}
          unitText="/month"
          subText={`${shuttle.from} → ${shuttle.to}`}
          onCall={handleCall}
          onChat={handleDirectChat}
          onWhatsApp={handleWhatsApp}
          onBook={handleDirectChat}
          bookLabel="Book"
          phoneTitle={phoneRevealed ? shuttle.phone : 'Click to call host'}
        />
      )}

      <div className="hidden md:block">
        <AppFooter />
      </div>
    </div>
  );
}

