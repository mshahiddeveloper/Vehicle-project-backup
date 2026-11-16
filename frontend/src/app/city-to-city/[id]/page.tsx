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
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import { useCountry } from '@/app/context/CountryContext';
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
  CheckCircle2,
  Share2,
  Check,
  Car,
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

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-6 md:py-10 flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-[#667085]">
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
        </div>

        {/* Route Hero Card */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-blue-200 border border-white/20">
                <Car className="w-3.5 h-3.5" />
                <span>Private Intercity Motorway Service</span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-4xl tracking-tight">
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

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start pt-2">
          {/* Left Column: Details & Operator Identity */}
          <div className="flex flex-col gap-8">
            {/* Clickable Host / Operator Identity Section */}
            <Link
              href={`/store/${storeSlug}`}
              className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 flex items-center gap-4 border border-slate-200/80 hover:border-slate-300 transition group cursor-pointer"
              title={`View ${ride.op}'s Public Storefront`}
            >
              <div className="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-heading font-extrabold text-xl shrink-0 group-hover:scale-105 transition">
                {ride.op.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-extrabold text-base text-slate-900 group-hover:text-blue-700 transition truncate">
                    Operated by {ride.op}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                    View Fleet Store ➔
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  Direct intercity transport host · {isPakistan ? 'Dedicated driver with vehicle' : 'Dedicated chauffeur with vehicle'}
                </p>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs">
                Verified Fleet
              </span>
            </Link>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-slate-500">Duration</span>
                <span className="font-heading font-bold text-sm text-slate-900">
                  {ride.duration}
                </span>
              </div>
              <div className="p-4 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-slate-500">Seating</span>
                <span className="font-heading font-bold text-sm text-slate-900">
                  Up to 4 Passengers
                </span>
              </div>
              <div className="p-4 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-slate-500">Luggage</span>
                <span className="font-heading font-bold text-sm text-slate-900">
                  {ride.bag}
                </span>
              </div>
              <div className="p-4 border border-slate-200/80 rounded-2xl flex flex-col gap-1 bg-white">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-slate-500">Pickup</span>
                <span className="font-heading font-bold text-sm text-slate-900">
                  Doorstep in {ride.fromCity}
                </span>
              </div>
            </div>

            {/* Route Highlights & Inclusions */}
            <div className="p-6 border border-slate-200/80 rounded-3xl bg-white space-y-4">
              <h2 className="font-heading font-bold text-lg text-slate-900">
                Route Highlights & Features
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
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
              <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-slate-100">
                {ride.tags.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Direct Safety Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Notice:</strong> SafarPK provides a direct communication bridge between passengers and independent fleet hosts. Confirm departure schedule, toll fee policy, and luggage capacity directly with the operator via phone or WhatsApp before traveling.
            </div>
          </div>

          {/* Right Column: Pricing & Contact Card */}
          <aside className="sticky top-24 border border-slate-200/90 rounded-3xl p-6 bg-white shadow-lg space-y-5">
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
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
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
                  className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  Submit Inquiry
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
          className="flex-1 h-11 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <Phone className="w-3.5 h-3.5 text-purple-600" />
          <span>{phoneRevealed ? ride.phone : 'Show Number'}</span>
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

