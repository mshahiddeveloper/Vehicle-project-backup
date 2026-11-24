'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { CITY_RIDES_DATA, CityRideItem } from '@/data/marketplaceData';
import { getStoreSlugForOwner } from '@/data/storefrontEngine';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { getWhatsAppTargetUrl, startOrOpenConversation } from '@/data/chatEngine';
import { getActiveUser } from '@/data/userAuth';
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
  Calendar,
  Clock,
  Briefcase,
  Users,
  ShieldCheck,
  Phone,
  MessageSquare,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  Share2,
  Check,
  Car,
  Heart,
} from 'lucide-react';

export default function CityRideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';
  const { country, formatPrice } = useCountry();
  const isPakistan = !country || country.code === 'PK';

  const ride: CityRideItem | undefined = useMemo(() => {
    return (
      CITY_RIDES_DATA.find((r) => r.id === id) ||
      CITY_RIDES_DATA.find((r) => r.id.toLowerCase() === id.toLowerCase()) ||
      CITY_RIDES_DATA[0]
    );
  }, [id]);

  const [tripType, setTripType] = useState<'oneway' | 'return'>('oneway');
  const [selectedDate, setSelectedDate] = useState('2026-11-20');
  const [returnDate, setReturnDate] = useState('2026-11-23');
  const [passengerCount, setPassengerCount] = useState(2);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!ride) return;
    const checkSaved = () => {
      const items = getSavedWishlistItems();
      setIsSaved(items.some((it) => it.id === ride.id));
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
  }, [ride]);

  const handleToggleSaveRide = () => {
    if (!ride) return;
    const activeUser = getActiveUser();
    const rideItem: WishlistItem = {
      id: ride.id,
      category: 'ride',
      name: `${ride.fromCity} ➔ ${ride.toCity}`,
      title: `${ride.fromCity} ➔ ${ride.toCity} (${ride.car})`,
      sub: `${ride.car} · ${ride.duration}`,
      specs: `${ride.car} · ${ride.time}`,
      city: ride.fromCity,
      rate: `Rs. ${currentFare.toLocaleString()}`,
      price: `Rs. ${currentFare.toLocaleString()}`,
      href: `/city-to-city/${ride.id}`,
    };

    if (!activeUser) {
      setPendingWishlist(rideItem, `/city-to-city/${ride.id}`);
      router.push(`/login?pending_wishlist=1&redirect=${encodeURIComponent(`/city-to-city/${ride.id}`)}`);
      return;
    }

    if (isSaved) {
      removeWishlistItem(ride.id);
      setIsSaved(false);
    } else {
      saveWishlistItem(rideItem);
      setIsSaved(true);
    }
  };

  const scrollToBooking = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('city-ride-booking-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const currentFare = tripType === 'return' ? ride.ret : ride.one;

  const handleCall = () => {
    setPhoneRevealed(true);
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: ride.id,
      targetTitle: `${ride.fromCity} to ${ride.toCity} (${ride.car})`,
      targetCategory: 'CITY_TO_CITY',
      targetOwnerName: ride.op,
      city: ride.fromCity,
    });
    recordLead({
      userId: ride.id,
      customerName: 'Direct Caller',
      customerPhone: 'Phone Dial',
      customerCity: ride.fromCity,
      serviceType: 'City to City',
      notes: `Direct call for ride ${ride.fromCity} ➔ ${ride.toCity} with ${ride.op}`,
    });
    if (phoneRevealed) {
      window.location.href = `tel:${ride.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleWhatsApp = () => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: ride.id,
      targetTitle: `${ride.fromCity} to ${ride.toCity} (${ride.car})`,
      targetCategory: 'CITY_TO_CITY',
      targetOwnerName: ride.op,
      city: ride.fromCity,
    });
    recordLead({
      userId: ride.id,
      customerName: 'WhatsApp Inquirer',
      customerPhone: 'WhatsApp Chat',
      customerCity: ride.fromCity,
      serviceType: 'City to City',
      notes: `Direct WhatsApp inquiry for ride ${ride.fromCity} ➔ ${ride.toCity}`,
    });

    const text = `Assalam-o-Alaikum ${ride.op},\n\nI am contacting you from SafarPK regarding your City to City ride:\n• Route: ${ride.fromCity} ➔ ${ride.toCity}\n• Vehicle: ${ride.car}\n• Trip Type: ${tripType === 'return' ? 'Return Trip' : 'One Way'}\n• Travel Date: ${selectedDate}\n• Fare: ${formatPrice(currentFare)}\n\nPlease confirm availability and pickup details.`;
    const waUrl = getWhatsAppTargetUrl(ride.whatsapp || ride.phone, text);
    window.open(waUrl, '_blank');
  };

  const handleDirectChat = () => {
    if (!ride) return;
    const user = getActiveUser();
    if (!user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/city-to-city/${ride.id}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (user.role === 'VENDOR' || user.role === 'LISTER' || user.role === 'DRIVER') {
      router.push('/inbox');
      return;
    }

    recordClickEvent({
      clickType: 'CHAT_CLICK',
      targetId: ride.id,
      targetTitle: `${ride.fromCity} to ${ride.toCity} (${ride.car})`,
      targetCategory: 'CITY_TO_CITY',
      targetOwnerName: ride.op,
      city: ride.fromCity,
    });

    const convId = startOrOpenConversation({
      currentUser: user,
      partnerId: ride.id,
      partnerName: ride.op,
      partnerRole: 'LISTER',
      partnerPhone: ride.whatsapp || ride.phone || '+92 300 1234567',
      about: `City to City: ${ride.fromCity} ➔ ${ride.toCity} (${ride.car})`,
      bookingMetadata: {
        category: 'city_to_city',
        customerName: user.name,
        customerPhone: user.phone,
        customerCity: user.city || ride.fromCity,
        providerName: ride.op,
        providerPhone: ride.whatsapp || ride.phone || '+92 300 1234567',
        itemName: `${ride.fromCity} to ${ride.toCity} (${ride.car})`,
        pickupDate: selectedDate,
        totalEstimate: formatPrice(currentFare),
        serviceMode: tripType === 'return' ? 'Return Trip' : 'One Way',
        bookingRef: `C2C-${Math.floor(10000 + Math.random() * 90000)}`,
      },
      initialGreeting: `Assalam-o-Alaikum ${ride.op}! I am interested in your City to City ride from ${ride.fromCity} to ${ride.toCity} on ${selectedDate}. Are seats/car available?`,
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

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordLead({
      userId: ride.id,
      customerName: 'Booking Requester',
      customerPhone: 'Online Request',
      customerCity: ride.fromCity,
      serviceType: 'City to City',
      notes: `Request for ${ride.fromCity} to ${ride.toCity} on ${selectedDate} (${tripType})`,
    });
    setBookingSuccess(true);
  };

  const storeSlug = getStoreSlugForOwner(ride.op);

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col justify-between">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-6 md:py-10 flex flex-col gap-4 sm:gap-6 pb-24 lg:pb-16">
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
              {ride.fromCity} ➔ {ride.toCity}
            </span>
            <span className="text-[10px] text-blue-700 font-bold block truncate">
              {ride.car} · Intercity Motorway
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyShare}
              className="w-10 h-10 rounded-2xl border border-slate-200/80 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
              aria-label="Share route"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> : <Share2 className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              type="button"
              onClick={handleToggleSaveRide}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition active:scale-95 shadow-2xs cursor-pointer ${
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
            <Link href="/city-to-city" className="hover:text-[#101828]">
              City to City
            </Link>
            <span>/</span>
            <span className="text-[#101828] font-semibold">
              {ride.fromCity} to {ride.toCity}
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
              onClick={handleToggleSaveRide}
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
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-blue-200 border border-white/20">
                <Car className="w-3.5 h-3.5" />
                <span>Private Intercity Motorway Service</span>
              </div>
              <h1 className="font-heading font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-tight">
                {ride.fromCity} <span className="text-blue-400">➔</span> {ride.toCity}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl">
                {ride.car} · {ride.duration} · {ride.time}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15">
              <span className="text-xs text-blue-200 font-bold uppercase tracking-wider">
                Starting from
              </span>
              <div className="font-heading font-black text-2xl sm:text-3xl text-white">
                {formatPrice(ride.one)}
              </div>
              <span className="text-xs text-slate-300">One-way private hire</span>
            </div>
          </div>
        </div>

        {/* Quick Mobile Action Bar: Book Ride & In-App Chat */}
        <div className="lg:hidden flex items-center gap-2 p-3 rounded-2xl bg-blue-50/80 border border-blue-200 shadow-2xs">
          <button
            type="button"
            onClick={scrollToBooking}
            className="flex-1 h-11 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-200 shrink-0" />
            <span>Book Ride</span>
          </button>
          <button
            type="button"
            onClick={handleDirectChat}
            className="h-11 px-4 bg-white hover:bg-slate-50 text-blue-900 border border-blue-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer shrink-0"
            title="Chat directly on SafarPK"
          >
            <MessageSquare className="w-4 h-4 text-blue-600 fill-blue-100 shrink-0" />
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
              title={`View ${ride.op}'s Public Storefront`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-heading font-extrabold text-lg sm:text-xl shrink-0 group-hover:scale-105 transition">
                {ride.op.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-700 transition truncate">
                    Operated by {ride.op}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                    Fleet Store ➔
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Direct intercity transport host · {isPakistan ? 'Dedicated driver with vehicle' : 'Dedicated chauffeur with vehicle'}
                </p>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs">
                Verified Fleet
              </span>
            </Link>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] text-slate-500">Duration</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {ride.duration}
                </span>
              </div>
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] text-slate-500">Seating</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  Up to 4 Passengers
                </span>
              </div>
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] text-slate-500">Luggage</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {ride.bag}
                </span>
              </div>
              <div className="p-3.5 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] text-slate-500">Pickup</span>
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                  Doorstep in {ride.fromCity}
                </span>
              </div>
            </div>

            {/* Route Highlights & Inclusions (Mobile Accordion) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
              <button
                type="button"
                onClick={() => setFeaturesOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Route Highlights & Inclusions</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      Private Service
                    </span>
                  </div>
                  {/* Summary preview */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Doorstep Pickup
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Direct Dropoff
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      Motorway AC Sedan
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
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Doorstep pickup from anywhere in {ride.fromCity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Direct dropoff at your exact destination in {ride.toCity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Full air-conditioned comfortable private sedan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Comfort stop on Motorway service area as requested</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No shared strangers — exclusive car for your group</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Direct payment to driver upon completion</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
                    {ride.tags.map((t) => (
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
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span>Travel Policies & Toll Information</span>
                  </h2>
                  {!policiesOpen && (
                    <p className="text-xs text-slate-500 line-clamp-1 pt-1">
                      Direct driver settlement, motorway comfort stops & toll tax policies.
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
                    <strong>Notice:</strong> SafarPK provides a direct communication bridge between passengers and independent fleet hosts.
                  </p>
                  <p>
                    Confirm departure schedule, toll fee policy, and luggage capacity directly with the operator via phone or WhatsApp before traveling.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing & Contact Card */}
          <aside id="city-ride-booking-section" className="relative lg:sticky lg:top-24 border border-slate-200/90 rounded-3xl p-5 sm:p-6 bg-white shadow-lg space-y-5 scroll-mt-24 mb-4">
            {/* Trip Type Selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTripType('oneway')}
                className={`h-9 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  tripType === 'oneway'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                One Way
              </button>
              <button
                type="button"
                onClick={() => setTripType('return')}
                className={`h-9 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  tripType === 'return'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Return Trip
              </button>
            </div>

            {/* Pricing Display */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {tripType === 'return' ? 'Round Trip Fare' : 'One Way Direct Fare'}
              </span>
              <div className="font-heading font-black text-3xl text-slate-900">
                {formatPrice(currentFare)}
              </div>
              <p className="text-xs text-slate-500">
                {tripType === 'return'
                  ? 'Includes same day or designated return'
                  : 'Total vehicle rate for entire car'}
              </p>
            </div>

            {/* Direct Contact Buttons */}
            <div className="space-y-2 pt-1">
              {/* Instant WhatsApp Button */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
                <span>WhatsApp</span>
              </button>

              {/* In-App Direct Chat Button */}
              <button
                type="button"
                onClick={handleDirectChat}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-200" />
                <span>Chat with Operator</span>
              </button>

              {/* Direct Call Button (Click to Reveal Pattern) */}
              <button
                type="button"
                onClick={handleCall}
                className="w-full h-10 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-[0.99]"
                title={phoneRevealed ? `Call host directly: ${ride.phone}` : 'Click to show phone number'}
              >
                <Phone className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {phoneRevealed ? (
                    <>Call Host: <span className="font-mono font-bold">{ride.phone}</span></>
                  ) : (
                    'Show Phone Number'
                  )}
                </span>
              </button>
            </div>

            {/* Booking Inquiry Form */}
            {bookingSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-heading font-bold text-sm text-emerald-900">
                  Request Dispatched!
                </h4>
                <p className="text-xs text-emerald-700">
                  {ride.op} has been notified. They will call or message you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">
                  Or Send Booking Request
                </span>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Travel Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => {
                      const today = new Date().toISOString().split('T')[0];
                      if (e.target.value && e.target.value < today) {
                        setSelectedDate(today);
                      } else {
                        setSelectedDate(e.target.value);
                      }
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Pickup Area in {ride.fromCity}</label>
                  <input
                    type="text"
                    placeholder="e.g. DHA Phase 5 or Gulberg"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Submit Intercity Ride Inquiry</span>
                </button>
                <p className="text-[11px] text-slate-500 text-center font-medium pt-1">
                  Direct operator booking · Pay at pickup
                </p>
              </form>
            )}
          </aside>
        </div>
      </main>

      {/* Mobile App Sticky Action Bar (Direct, Elevated, Never Hidden Behind Menu) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl flex items-center gap-2 z-50">
        <button
          type="button"
          onClick={handleCall}
          className="flex-1 h-12 rounded-2xl border border-purple-200 bg-purple-50 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition shadow-2xs"
          title={phoneRevealed ? ride.phone : 'Click to show phone number'}
        >
          <Phone className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="truncate">{phoneRevealed ? ride.phone : 'Show Number'}</span>
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
          className="flex-1 h-12 rounded-2xl bg-[#101828] hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
        >
          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Book Ride</span>
        </button>
      </div>

      <div className="hidden md:block">
        <AppFooter />
      </div>
    </div>
  );
}

